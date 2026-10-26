import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { fechaEnGuayaquil } from '@oasis/shared';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import {
  POLIZAS_REPOSITORY,
  type PolizasRepositoryPort,
} from '../src/modules/polizas/application/ports/polizas.repository.port';
import { MarcarCuotasVencidasUseCase } from '../src/modules/polizas/application/use-cases/marcar-cuotas-vencidas.use-case';
import { TOKENS_TRANSVERSALES } from '../src/shared-kernel/tokens';
import { cedulaValida } from './identificaciones';
import { crearPolizaDePrueba } from './polizas-de-prueba';

/** HU-35 (plan de cuotas, D11) y HU-37 (vencimiento y mora, D14 y D15) de punta a punta. */
describe('Plan de cuotas y vencimiento (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let tokenOperador: string;
  let tokenCliente: string;
  let contadorIp = 0;
  const sufijo = Date.now();

  function ip(): string {
    contadorIp += 1;
    return `192.0.2.${(contadorIp % 250) + 1}`;
  }

  function como(token: string, metodo: 'get' | 'post' | 'patch' | 'put', ruta: string) {
    return request(app.getHttpServer())
      [metodo](ruta)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${token}`);
  }

  async function login(email: string, password: string): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email, password })
      .expect(200);
    return respuesta.body.accessToken as string;
  }

  const TRES = [
    { numero: 1, valor: '100.00', fechaVencimiento: '2026-01-31' },
    { numero: 2, valor: '100.00', fechaVencimiento: '2026-02-28' },
    { numero: 3, valor: '100.00', fechaVencimiento: '2026-03-31' },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();
    prisma = app.get(PrismaService);
    tokenOperador = await login('operador@oasis.com', 'Operador.Oasis1');
    tokenCliente = await login('cliente@oasis.com', 'Cliente.Oasis1');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('una póliza nueva nace con una cuota por la prima, con vencimiento en su inicio (D11)', async () => {
    const cliente = await como(tokenOperador, 'post', '/api/v1/clientes')
      .send({
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo + 900),
        nombres: 'Cliente',
        apellidos: 'Cuotas',
        email: `cuotas.${sufijo}@example.com`,
      })
      .expect(201);
    const aseguradora = await prisma.aseguradora.findFirstOrThrow();
    const ramo = await prisma.ramo.findUniqueOrThrow({ where: { codigo: 'VIDA' } });
    const poliza = await como(tokenOperador, 'post', '/api/v1/polizas')
      .send({
        numero: `POL-CUOTAS-${sufijo}`,
        clienteId: cliente.body.id as string,
        aseguradoraId: aseguradora.id,
        ramoId: ramo.id,
        primaTotal: '300.00',
        fechaInicio: '2026-01-31',
        fechaFin: '2026-12-31',
      })
      .expect(201);

    const plan = await como(
      tokenOperador,
      'get',
      `/api/v1/polizas/${poliza.body.id as string}/cuotas`,
    ).expect(200);

    expect(plan.body).toEqual([
      expect.objectContaining({
        numero: 1,
        valor: '300.00',
        valorPagado: '0.00',
        fechaVencimiento: '2026-01-31',
        estado: 'PENDIENTE',
      }),
    ]);
  });

  it('PUT de 3 cuotas que suman la prima → 200 y queda en la bitácora como MODIFICAR/PlanCuotas', async () => {
    const polizaId = await crearPolizaDePrueba(prisma, { prima: '300.00' });

    const respuesta = await como(tokenOperador, 'put', `/api/v1/polizas/${polizaId}/cuotas`)
      .send({ cuotas: TRES })
      .expect(200);

    expect(respuesta.body.map((c: { numero: number }) => c.numero)).toEqual([1, 2, 3]);
    const bitacora = await prisma.bitacoraAuditoria.findFirstOrThrow({
      where: { entidad: 'PlanCuotas', entidadId: polizaId },
    });
    expect(bitacora.accion).toBe('MODIFICAR');
  });

  it('un plan que no cuadra con la prima → 422 PLAN_NO_CUADRA con suma y prima (RN-15)', async () => {
    const polizaId = await crearPolizaDePrueba(prisma, { prima: '300.00' });

    const respuesta = await como(tokenOperador, 'put', `/api/v1/polizas/${polizaId}/cuotas`)
      .send({ cuotas: TRES.slice(0, 2) })
      .expect(422);

    expect(respuesta.body.details).toEqual({
      campo: 'cuotas',
      motivo: 'PLAN_NO_CUADRA',
      suma: '200.00',
      prima: '300.00',
    });
  });

  it('con un pago validado el plan ya no cambia → 422 PLAN_CON_PAGOS_VALIDADOS', async () => {
    const polizaId = await crearPolizaDePrueba(prisma, { prima: '300.00' });
    const pago = await como(tokenOperador, 'post', '/api/v1/pagos')
      .send({
        polizaId,
        monto: '10.00',
        fechaPago: fechaEnGuayaquil(new Date()),
        metodo: 'DEBITO_BANCARIO',
        referencia: randomUUID(),
      })
      .expect(201);
    await como(tokenOperador, 'patch', `/api/v1/pagos/${pago.body.id as string}/validar`)
      .send({ confirmado: true })
      .expect(200);

    const respuesta = await como(tokenOperador, 'put', `/api/v1/polizas/${polizaId}/cuotas`)
      .send({ cuotas: TRES })
      .expect(422);

    expect(respuesta.body.details).toMatchObject({ motivo: 'PLAN_CON_PAGOS_VALIDADOS' });
  });

  it('el CLIENTE no accede al plan de cuotas → 403', async () => {
    const polizaId = await crearPolizaDePrueba(prisma, { prima: '300.00' });
    await como(tokenCliente, 'get', `/api/v1/polizas/${polizaId}/cuotas`).expect(403);
    await como(tokenCliente, 'put', `/api/v1/polizas/${polizaId}/cuotas`)
      .send({ cuotas: TRES })
      .expect(403);
  });

  it('HU-37: con reloj de Guayaquil del 24/10 marca VENCIDA la del 23/10, no la del 24/10, y la póliza queda en mora', async () => {
    const polizaId = await crearPolizaDePrueba(prisma, {
      prima: '200.00',
      fechaInicio: '2026-10-23',
      fechaFin: '2027-10-22',
    });
    await como(tokenOperador, 'put', `/api/v1/polizas/${polizaId}/cuotas`)
      .send({
        cuotas: [
          { numero: 1, valor: '100.00', fechaVencimiento: '2026-10-23' },
          { numero: 2, valor: '100.00', fechaVencimiento: '2026-10-24' },
        ],
      })
      .expect(200);
    const marcar = new MarcarCuotasVencidasUseCase(
      app.get<PolizasRepositoryPort>(POLIZAS_REPOSITORY, { strict: false }),
      // 05:10 UTC = 00:10 del 24/10 en Guayaquil.
      { ahora: () => new Date('2026-10-24T05:10:00.000Z') },
    );

    const primera = await marcar.ejecutar();
    const segunda = await marcar.ejecutar();

    const cuotas = await prisma.cuota.findMany({ where: { polizaId }, orderBy: { numero: 'asc' } });
    expect(cuotas.map((c) => c.estado)).toEqual(['VENCIDA', 'PENDIENTE']);
    expect(primera.actualizadas).toBeGreaterThanOrEqual(1);
    expect(segunda.actualizadas).toBe(0);
    const poliza = await como(tokenOperador, 'get', `/api/v1/polizas/${polizaId}`).expect(200);
    expect(poliza.body.enMora).toBe(true);
  });

  describe('HU-36: aplicación de pagos a cuotas (D11 a D14)', () => {
    function registrar(polizaId: string, monto: string, fechaPago = fechaEnGuayaquil(new Date())) {
      return como(tokenOperador, 'post', '/api/v1/pagos')
        .send({ polizaId, monto, fechaPago, metodo: 'TRANSFERENCIA', referencia: randomUUID() })
        .expect(201)
        .then((r) => r.body.id as string);
    }

    const validar = (pagoId: string) =>
      como(tokenOperador, 'patch', `/api/v1/pagos/${pagoId}/validar`).send({ confirmado: true });

    const cuotasDe = (polizaId: string) =>
      prisma.cuota.findMany({ where: { polizaId }, orderBy: { numero: 'asc' } });

    /** D13: por póliza, Σ Cuota.valorPagado = Σ pagos VALIDADOS. */
    async function exigirInvariante(polizaId: string): Promise<string> {
      const cuotas = await prisma.cuota.aggregate({
        where: { polizaId },
        _sum: { valorPagado: true },
      });
      const pagos = await prisma.pago.aggregate({
        where: { polizaId, estado: 'VALIDADO' },
        _sum: { monto: true },
      });
      const aplicado = cuotas._sum.valorPagado?.toFixed(2) ?? '0.00';
      expect(aplicado).toBe(pagos._sum.monto?.toFixed(2) ?? '0.00');
      return aplicado;
    }

    async function polizaConPlan(
      prima: string,
      cuotas: Array<{ numero: number; valor: string; fechaVencimiento: string }>,
    ): Promise<string> {
      const polizaId = await crearPolizaDePrueba(prisma, {
        prima,
        fechaInicio: '2026-01-01',
        fechaFin: '2027-12-31',
      });
      await como(tokenOperador, 'put', `/api/v1/polizas/${polizaId}/cuotas`)
        .send({ cuotas })
        .expect(200);
      return polizaId;
    }

    it('50 sobre 33,33/33,33/33,34: la primera por vencer queda PAGADA y la segunda PARCIAL con 16,67 (HU-36.1, HU-36.2)', async () => {
      const polizaId = await polizaConPlan('100.00', [
        { numero: 1, valor: '33.33', fechaVencimiento: '2027-01-31' },
        { numero: 2, valor: '33.33', fechaVencimiento: '2027-02-28' },
        { numero: 3, valor: '33.34', fechaVencimiento: '2027-03-31' },
      ]);
      const pagoId = await registrar(polizaId, '50.00');

      await validar(pagoId).expect(200);

      const cuotas = await cuotasDe(polizaId);
      expect(cuotas.map((c) => [c.estado, c.valorPagado.toFixed(2)])).toEqual([
        ['PAGADA', '33.33'],
        ['PARCIAL', '16.67'],
        ['PENDIENTE', '0.00'],
      ]);
      expect(await exigirInvariante(polizaId)).toBe('50.00');
    });

    it('un segundo pago completa la PARCIAL y la siguiente: ambas quedan PAGADAS (HU-36.3)', async () => {
      const polizaId = await polizaConPlan('100.00', [
        { numero: 1, valor: '33.33', fechaVencimiento: '2027-01-31' },
        { numero: 2, valor: '33.33', fechaVencimiento: '2027-02-28' },
        { numero: 3, valor: '33.34', fechaVencimiento: '2027-03-31' },
      ]);
      await validar(await registrar(polizaId, '50.00')).expect(200);

      await validar(await registrar(polizaId, '50.00')).expect(200);

      const cuotas = await cuotasDe(polizaId);
      expect(cuotas.map((c) => c.estado)).toEqual(['PAGADA', 'PAGADA', 'PAGADA']);
      expect(cuotas.map((c) => c.valorPagado.toFixed(2))).toEqual(['33.33', '33.33', '33.34']);
      expect(await exigirInvariante(polizaId)).toBe('100.00');
    });

    it('una cuota VENCIDA cubierta en parte sigue VENCIDA con el abono y la póliza sigue en mora (D11)', async () => {
      const polizaId = await polizaConPlan('200.00', [
        { numero: 1, valor: '100.00', fechaVencimiento: '2026-02-28' },
        { numero: 2, valor: '100.00', fechaVencimiento: '2027-02-28' },
      ]);

      await validar(await registrar(polizaId, '40.00')).expect(200);

      const cuotas = await cuotasDe(polizaId);
      expect(cuotas.map((c) => [c.estado, c.valorPagado.toFixed(2)])).toEqual([
        ['VENCIDA', '40.00'],
        ['PENDIENTE', '0.00'],
      ]);
      const poliza = await como(tokenOperador, 'get', `/api/v1/polizas/${polizaId}`).expect(200);
      expect(poliza.body.enMora).toBe(true);
      await exigirInvariante(polizaId);
    });

    it('el detalle del pago y el plan de la póliza muestran la aplicación (HU-36.4, D14)', async () => {
      const polizaId = await polizaConPlan('100.00', [
        { numero: 1, valor: '33.33', fechaVencimiento: '2027-01-31' },
        { numero: 2, valor: '33.33', fechaVencimiento: '2027-02-28' },
        { numero: 3, valor: '33.34', fechaVencimiento: '2027-03-31' },
      ]);
      const pagoId = await registrar(polizaId, '50.00');
      const sinAplicar = await como(tokenOperador, 'get', `/api/v1/pagos/${pagoId}`).expect(200);
      expect(sinAplicar.body).toMatchObject({ id: pagoId, aplicaciones: [], recibo: null });
      const validado = await validar(pagoId).expect(200);

      const detalle = await como(tokenOperador, 'get', `/api/v1/pagos/${pagoId}`).expect(200);
      const plan = await como(tokenOperador, 'get', `/api/v1/polizas/${polizaId}/cuotas`).expect(
        200,
      );

      expect(detalle.body).toMatchObject({
        id: pagoId,
        estado: 'VALIDADO',
        aplicaciones: [
          { cuotaNumero: 1, monto: '33.33' },
          { cuotaNumero: 2, monto: '16.67' },
        ],
        recibo: {
          id: validado.body.recibo.id,
          codigo: validado.body.recibo.codigo,
          estado: 'PENDIENTE_ANCLAJE',
        },
      });
      expect(
        plan.body.map((c: { aplicaciones: Array<Record<string, unknown>> }) => c.aplicaciones),
      ).toEqual([
        [{ pagoId, monto: '33.33', fecha: expect.any(String) }],
        [{ pagoId, monto: '16.67', fecha: expect.any(String) }],
        [],
      ]);
      expect(plan.body.map((c: { valorPagado: string }) => c.valorPagado)).toEqual([
        '33.33',
        '16.67',
        '0.00',
      ]);
      await como(tokenOperador, 'get', `/api/v1/pagos/${randomUUID()}`).expect(404);
      await como(tokenCliente, 'get', `/api/v1/pagos/${pagoId}`).expect(403);
    });

    it('dos validaciones simultáneas que juntas superan el saldo: una 200 y la otra 422 MONTO_SUPERA_SALDO (D12)', async () => {
      for (let intento = 0; intento < 3; intento += 1) {
        const polizaId = await crearPolizaDePrueba(prisma, {
          prima: '100.00',
          fechaInicio: '2026-12-01',
          fechaFin: '2027-11-30',
        });
        const primero = await registrar(polizaId, '60.00');
        const segundo = await registrar(polizaId, '60.00');

        const respuestas = await Promise.all([validar(primero), validar(segundo)]);

        expect(respuestas.map((r) => r.status).sort()).toEqual([200, 422]);
        const rechazo = respuestas.find((r) => r.status === 422);
        expect(rechazo?.body.details).toMatchObject({
          campo: 'monto',
          motivo: 'MONTO_SUPERA_SALDO',
          saldo: '40.00',
        });
        expect(await prisma.pago.count({ where: { polizaId, estado: 'VALIDADO' } })).toBe(1);
        expect(await prisma.recibo.count({ where: { pago: { polizaId } } })).toBe(1);
        expect(await exigirInvariante(polizaId)).toBe('60.00');
      }
    });

    it('editar la vigencia de una póliza con pagos aplicados → 200 y conserva lo pagado (D13)', async () => {
      const polizaId = await crearPolizaDePrueba(prisma, {
        prima: '100.00',
        fechaInicio: '2026-12-01',
        fechaFin: '2027-11-30',
      });
      await validar(await registrar(polizaId, '30.00')).expect(200);

      const editada = await como(tokenOperador, 'patch', `/api/v1/polizas/${polizaId}`)
        .send({ fechaInicio: '2026-12-15', fechaFin: '2027-12-14' })
        .expect(200);

      expect(editada.body).toMatchObject({ fechaInicio: '2026-12-15', fechaFin: '2027-12-14' });
      const [cuota] = await cuotasDe(polizaId);
      expect(cuota.fechaVencimiento.toISOString().slice(0, 10)).toBe('2026-12-15');
      expect(cuota.valorPagado.toFixed(2)).toBe('30.00');
      expect(cuota.estado).toBe('PARCIAL');
      expect(await prisma.aplicacionPago.count({ where: { cuotaId: cuota.id } })).toBe(1);
      await exigirInvariante(polizaId);
    });
  });

  describe('HU-38: cartera con el reloj fijo en el 24/10/2026 de Guayaquil (D16)', () => {
    let cartera: NestExpressApplication;
    let clienteId: string;
    let polizaId: string;
    let aseguradoraId: string;
    let otraAseguradoraId: string;
    let numeros: Record<number, string>;

    const listar = (query: Record<string, unknown>) =>
      request(cartera.getHttpServer())
        .get('/api/v1/cuotas')
        .query({ clienteId, pageSize: 50, ...query })
        .set('X-Forwarded-For', ip())
        .set('Authorization', `Bearer ${tokenOperador}`);

    const resumen = (filas: Array<Record<string, unknown>>) =>
      filas.map((f) => [f.numero, f.pendiente, f.diasAtraso, f.estado]);

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(TOKENS_TRANSVERSALES.CLOCK)
        // 15:00 UTC = 10:00 del 24/10 en Guayaquil.
        .useValue({ ahora: () => new Date('2026-10-24T15:00:00.000Z') })
        .compile();
      cartera = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
      cartera.set('trust proxy', 1);
      cartera.use(cookieParser());
      cartera.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
      await cartera.init();

      const [aseguradora, otra] = await prisma.aseguradora.findMany({
        orderBy: { nombre: 'asc' },
        take: 2,
      });
      aseguradoraId = aseguradora.id;
      otraAseguradoraId = otra.id;
      const servidor = cartera.getHttpServer();
      const conSesion = (metodo: 'post' | 'put' | 'patch', ruta: string) =>
        request(servidor)
          [metodo](ruta)
          .set('X-Forwarded-For', ip())
          .set('Authorization', `Bearer ${tokenOperador}`);

      const cliente = await conSesion('post', '/api/v1/clientes')
        .send({
          tipoIdentificacion: 'CEDULA',
          identificacion: cedulaValida(sufijo + 3838),
          nombres: 'Cliente',
          apellidos: 'Cartera',
          email: `cartera.${sufijo}@example.com`,
        })
        .expect(201);
      clienteId = cliente.body.id as string;
      const poliza = await conSesion('post', '/api/v1/polizas')
        .send({
          numero: `POL-CARTERA-${sufijo}`,
          clienteId,
          aseguradoraId,
          ramoId: (await prisma.ramo.findUniqueOrThrow({ where: { codigo: 'VIDA' } })).id,
          primaTotal: '600.00',
          fechaInicio: '2026-01-01',
          fechaFin: '2027-12-31',
        })
        .expect(201);
      polizaId = poliza.body.id as string;
      const fechas = [
        '2026-09-30',
        '2026-10-10',
        '2026-10-23',
        '2026-10-24',
        '2026-10-31',
        '2026-11-01',
      ];
      await conSesion('put', `/api/v1/polizas/${polizaId}/cuotas`)
        .send({
          cuotas: fechas.map((fechaVencimiento, i) => ({
            numero: i + 1,
            valor: '100.00',
            fechaVencimiento,
          })),
        })
        .expect(200);
      numeros = Object.fromEntries(fechas.map((fecha, i) => [i + 1, fecha]));
      // La cuota 1 queda PAGADA y la 2 VENCIDA con 30 abonados.
      for (const monto of ['100.00', '30.00']) {
        const pago = await conSesion('post', '/api/v1/pagos')
          .send({
            polizaId,
            monto,
            fechaPago: '2026-10-20',
            metodo: 'TRANSFERENCIA',
            referencia: randomUUID(),
          })
          .expect(201);
        await conSesion('patch', `/api/v1/pagos/${pago.body.id as string}/validar`)
          .send({ confirmado: true })
          .expect(200);
      }
    });

    afterAll(async () => {
      await cartera?.close();
    });

    it('VENCIDAS: las anteriores a hoy no pagadas, con días de atraso y sin la PAGADA (HU-38.1, HU-38.3)', async () => {
      const respuesta = await listar({ vista: 'VENCIDAS' }).expect(200);

      expect(resumen(respuesta.body.data)).toEqual([
        [2, '70.00', 14, 'VENCIDA'],
        [3, '100.00', 1, 'PENDIENTE'],
      ]);
      expect(respuesta.body.data[0]).toMatchObject({
        cuotaId: expect.any(String),
        valor: '100.00',
        fechaVencimiento: numeros[2],
        poliza: {
          id: polizaId,
          numero: `POL-CARTERA-${sufijo}`,
          ramo: 'Vida',
          ramoCodigo: 'VIDA',
          aseguradora: expect.any(String),
        },
        cliente: { id: clienteId, nombre: expect.stringContaining('Cartera') },
      });
    });

    it('POR_VENCER: de hoy a hoy + 7 incluidos; el día 8 queda fuera (HU-38.1)', async () => {
      const respuesta = await listar({ vista: 'POR_VENCER' }).expect(200);

      expect(resumen(respuesta.body.data)).toEqual([
        [4, '100.00', 0, 'PENDIENTE'],
        [5, '100.00', 0, 'PENDIENTE'],
      ]);
    });

    it('TODAS (por defecto) une ambas vistas por vencimiento ascendente, con el total (HU-38.1)', async () => {
      const respuesta = await listar({}).expect(200);

      expect(respuesta.body.data.map((f: { numero: number }) => f.numero)).toEqual([2, 3, 4, 5]);
      expect(respuesta.body.meta).toMatchObject({ total: 4, totalPages: 1 });
    });

    it('filtra por rango de vencimiento y por aseguradora (HU-38.2)', async () => {
      const rango = await listar({ desde: '2026-10-20', hasta: '2026-10-24' }).expect(200);
      expect(rango.body.data.map((f: { numero: number }) => f.numero)).toEqual([3, 4]);

      const propia = await listar({ aseguradoraId }).expect(200);
      expect(propia.body.meta.total).toBe(4);
      const otra = await listar({ aseguradoraId: otraAseguradoraId }).expect(200);
      expect(otra.body.meta.total).toBe(0);

      await listar({ desde: '2026-10-25', hasta: '2026-10-24' }).expect(400);
    });

    it('el CLIENTE no accede a la cartera → 403', async () => {
      await request(cartera.getHttpServer())
        .get('/api/v1/cuotas')
        .set('X-Forwarded-For', ip())
        .set('Authorization', `Bearer ${tokenCliente}`)
        .expect(403);
    });
  });
});
