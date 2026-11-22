import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { fechaEnGuayaquil } from '@oasis/shared';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { cedulaValida } from './identificaciones';
import { crearPolizaDePrueba } from './polizas-de-prueba';

/**
 * HU-16, HU-18 y HU-19 de punta a punta: registro con Débito bancario y RN-02, validación con
 * recibo en la misma respuesta y rechazo con autor propio. Cada caso usa su póliza (D22).
 */
describe('Pagos: registrar, validar y rechazar (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let tokenOperador: string;
  let tokenCliente: string;
  let operadorId: string;
  let contadorIp = 0;

  function ip(): string {
    contadorIp += 1;
    return `198.51.100.${(contadorIp % 250) + 1}`;
  }

  function como(token: string, metodo: 'get' | 'post' | 'patch' | 'put', ruta: string) {
    return request(app.getHttpServer())
      [metodo](ruta)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${token}`);
  }

  function registrar(polizaId: string, cambios: Record<string, unknown> = {}) {
    return como(tokenOperador, 'post', '/api/v1/pagos').send({
      polizaId,
      monto: '100.00',
      fechaPago: fechaEnGuayaquil(new Date()),
      metodo: 'DEBITO_BANCARIO',
      referencia: randomUUID(),
      ...cambios,
    });
  }

  const validar = (pagoId: string) =>
    como(tokenOperador, 'patch', `/api/v1/pagos/${pagoId}/validar`).send({ confirmado: true });

  async function login(email: string, password: string): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email, password })
      .expect(200);
    return respuesta.body.accessToken as string;
  }

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
    operadorId = (
      await prisma.usuario.findUniqueOrThrow({ where: { email: 'operador@oasis.com' } })
    ).id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('1. registra con Débito bancario: 201 REGISTRADO con el autor (HU-16)', async () => {
    const polizaId = await crearPolizaDePrueba(prisma);

    const respuesta = await registrar(polizaId).expect(201);

    expect(respuesta.body).toMatchObject({
      polizaId,
      metodo: 'DEBITO_BANCARIO',
      estado: 'REGISTRADO',
      registradoPorId: operadorId,
      validadoPorId: null,
      rechazadoPorId: null,
    });
  });

  it('2. exige la referencia y la hace única por póliza (D6)', async () => {
    const polizaId = await crearPolizaDePrueba(prisma);
    const otraPolizaId = await crearPolizaDePrueba(prisma);
    const referencia = randomUUID();

    await registrar(polizaId, { referencia: undefined }).expect(400);
    await registrar(polizaId, { referencia }).expect(201);
    const repetida = await registrar(polizaId, { referencia }).expect(409);
    expect(repetida.body.details).toEqual({ campo: 'referencia', motivo: 'REFERENCIA_DUPLICADA' });
    await registrar(otraPolizaId, { referencia }).expect(201);
  });

  it('3. RN-02 al registrar: monto > saldo → 422 con el saldo; monto = saldo → 201', async () => {
    const polizaId = await crearPolizaDePrueba(prisma, { prima: '518.40' });

    const excedido = await registrar(polizaId, { monto: '518.41' }).expect(422);
    expect(excedido.body.details).toEqual({
      campo: 'monto',
      motivo: 'MONTO_SUPERA_SALDO',
      saldo: '518.40',
    });
    await registrar(polizaId, { monto: '518.40' }).expect(201);
  });

  it('4. RN-02 al validar: dos pagos que juntos superan la prima, el segundo → 422 (D7)', async () => {
    const polizaId = await crearPolizaDePrueba(prisma, { prima: '150.00' });
    const primero = await registrar(polizaId, { monto: '100.00' }).expect(201);
    const segundo = await registrar(polizaId, { monto: '100.00' }).expect(201);

    await validar(primero.body.id as string).expect(200);
    const rechazado = await validar(segundo.body.id as string).expect(422);
    expect(rechazado.body.details).toEqual({
      campo: 'monto',
      motivo: 'MONTO_SUPERA_SALDO',
      saldo: '50.00',
    });
  });

  it('5. validar: 200 con autor, fecha y recibo PENDIENTE_ANCLAJE; otra vez → 422; sin PATCH /pagos/:id (HU-18)', async () => {
    const polizaId = await crearPolizaDePrueba(prisma);
    const pago = await registrar(polizaId).expect(201);
    const pagoId = pago.body.id as string;

    const respuesta = await validar(pagoId).expect(200);

    expect(respuesta.body.pago).toMatchObject({ estado: 'VALIDADO', validadoPorId: operadorId });
    expect(respuesta.body.pago.validadoEn).toEqual(expect.any(String));
    expect(respuesta.body.recibo).toMatchObject({ estado: 'PENDIENTE_ANCLAJE' });
    expect(respuesta.body.recibo.codigo).toMatch(/^RC-[0-9A-F]{12}$/);
    await validar(pagoId).expect(422);
    await como(tokenOperador, 'patch', `/api/v1/pagos/${pagoId}`)
      .send({ monto: '1.00' })
      .expect(404);
    await como(tokenOperador, 'put', `/api/v1/pagos/${pagoId}`).send({ monto: '1.00' }).expect(404);
  });

  it('6. rechazar: motivo obligatorio, autor propio, sin recibo, final y visible para el cliente (HU-19)', async () => {
    const polizaId = await crearPolizaDePrueba(prisma);
    const pago = await registrar(polizaId).expect(201);
    const pagoId = pago.body.id as string;
    const ruta = `/api/v1/pagos/${pagoId}/rechazar`;
    const motivo = 'La referencia no corresponde';

    await como(tokenOperador, 'patch', ruta).send({ confirmado: true }).expect(400);
    const respuesta = await como(tokenOperador, 'patch', ruta)
      .send({ confirmado: true, motivo })
      .expect(200);

    expect(respuesta.body).toMatchObject({
      estado: 'RECHAZADO',
      rechazadoPorId: operadorId,
      validadoPorId: null,
      validadoEn: null,
      motivoRechazo: motivo,
    });
    expect(respuesta.body.rechazadoEn).toEqual(expect.any(String));
    expect(await prisma.recibo.count({ where: { pagoId } })).toBe(0);
    await validar(pagoId).expect(422);

    // D15 ordena REGISTRADO primero: el filtro evita que el rechazo quede fuera de la página.
    const misPagos = await como(
      tokenCliente,
      'get',
      '/api/v1/mis-pagos?page=1&pageSize=100&estado=RECHAZADO',
    ).expect(200);
    const visto = (misPagos.body.data as Array<{ id: string; motivoRechazo: string | null }>).find(
      (item) => item.id === pagoId,
    );
    expect(visto?.motivoRechazo).toBe(motivo);
  });

  it('7. /mis-pagos devuelve rechazadoEn con fecha en un pago rechazado y null en uno validado (M6)', async () => {
    const polizaId = await crearPolizaDePrueba(prisma);
    const validado = await registrar(polizaId, { monto: '100.00' }).expect(201);
    const rechazado = await registrar(polizaId, { monto: '100.00' }).expect(201);
    await validar(validado.body.id as string).expect(200);
    await como(tokenOperador, 'patch', `/api/v1/pagos/${rechazado.body.id}/rechazar`)
      .send({ confirmado: true, motivo: 'La referencia no corresponde' })
      .expect(200);

    const misPagos = async (estado: string) =>
      (
        await como(
          tokenCliente,
          'get',
          `/api/v1/mis-pagos?page=1&pageSize=100&estado=${estado}`,
        ).expect(200)
      ).body.data as Array<{
        id: string;
        rechazadoEn: string | null;
        recibo: { id: string; codigo: string } | null;
      }>;
    const vistoRechazado = (await misPagos('RECHAZADO')).find((p) => p.id === rechazado.body.id);
    const vistoValidado = (await misPagos('VALIDADO')).find((p) => p.id === validado.body.id);

    expect(vistoRechazado?.rechazadoEn).toEqual(expect.any(String));
    expect(vistoValidado?.rechazadoEn).toBeNull();
    // D7: el portal arma /portal/recibos/:id con el recibo del pago validado.
    expect(vistoValidado?.recibo).toEqual({
      id: expect.any(String),
      codigo: expect.stringMatching(/^RC-[0-9A-F]{12}$/),
    });
    expect(vistoRechazado?.recibo).toBeNull();
  });

  describe('HU-20: listado de pagos', () => {
    const sufijo = Date.now();
    let clienteId: string;
    let ids: Record<'A' | 'B' | 'C' | 'D' | 'E', string>;
    let hoy: string;

    const diasAntes = (fecha: string, dias: number) =>
      new Date(Date.parse(`${fecha}T00:00:00Z`) - dias * 86_400_000).toISOString().slice(0, 10);

    const listar = (query: Record<string, unknown>) =>
      como(tokenOperador, 'get', '/api/v1/pagos').query(query).expect(200);

    beforeAll(async () => {
      hoy = fechaEnGuayaquil(new Date());
      const cliente = await como(tokenOperador, 'post', '/api/v1/clientes')
        .send({
          tipoIdentificacion: 'CEDULA',
          identificacion: cedulaValida(sufijo + 2020),
          nombres: 'Cliente',
          apellidos: 'Listado Pagos',
          email: `listado.pagos.${sufijo}@example.com`,
        })
        .expect(201);
      clienteId = cliente.body.id as string;
      const poliza = await como(tokenOperador, 'post', '/api/v1/polizas')
        .send({
          numero: `POL-HU20-${sufijo}`,
          clienteId,
          aseguradoraId: (await prisma.aseguradora.findFirstOrThrow()).id,
          ramoId: (await prisma.ramo.findUniqueOrThrow({ where: { codigo: 'VIDA' } })).id,
          primaTotal: '1000.00',
          fechaInicio: '2026-01-01',
          fechaFin: '2027-12-31',
        })
        .expect(201);
      const polizaId = poliza.body.id as string;

      const fechas = { A: 3, B: 1, C: 2, D: 0, E: 1 } as const;
      const creados = {} as Record<keyof typeof fechas, string>;
      for (const clave of ['A', 'B', 'C', 'D', 'E'] as const) {
        const pago = await registrar(polizaId, {
          monto: '10.00',
          fechaPago: diasAntes(hoy, fechas[clave]),
        }).expect(201);
        creados[clave] = pago.body.id as string;
      }
      await validar(creados.A).expect(200);
      await validar(creados.E).expect(200);
      await como(tokenOperador, 'patch', `/api/v1/pagos/${creados.B}/rechazar`)
        .send({ confirmado: true, motivo: 'La referencia no corresponde' })
        .expect(200);
      ids = creados;
    });

    it('filtra por cliente, muestra primero los por validar y luego por fecha descendente (HU-20.1, HU-20.2)', async () => {
      const respuesta = await listar({ clienteId, pageSize: 100 });

      expect(respuesta.body.data.map((p: { id: string }) => p.id)).toEqual([
        ids.D,
        ids.C,
        ids.E,
        ids.A,
        ids.B,
      ]);
      expect(respuesta.body.data.map((p: { estado: string }) => p.estado)).toEqual([
        'REGISTRADO',
        'REGISTRADO',
        'VALIDADO',
        'VALIDADO',
        'RECHAZADO',
      ]);
      expect(respuesta.body.meta.total).toBe(5);
    });

    it('filtra por rango de fechas de pago y por estado, con el total del filtro (HU-20.1, HU-20.3)', async () => {
      const rango = await listar({
        clienteId,
        desde: diasAntes(hoy, 2),
        hasta: diasAntes(hoy, 1),
      });
      expect(rango.body.data.map((p: { id: string }) => p.id)).toEqual([ids.C, ids.E, ids.B]);
      expect(rango.body.meta.total).toBe(3);

      const validados = await listar({ clienteId, estado: 'VALIDADO' });
      expect(validados.body.data.map((p: { id: string }) => p.id)).toEqual([ids.E, ids.A]);
      expect(validados.body.meta.total).toBe(2);
    });

    it('pagina conservando el orden y reporta total y páginas (HU-20.3)', async () => {
      const paginas = await Promise.all(
        [1, 2, 3].map((page) => listar({ clienteId, page, pageSize: 2 })),
      );

      expect(paginas.map((p) => p.body.data.length)).toEqual([2, 2, 1]);
      expect(paginas[0].body.meta).toEqual({ page: 1, pageSize: 2, total: 5, totalPages: 3 });
      expect(paginas.flatMap((p) => p.body.data.map((pago: { id: string }) => pago.id))).toEqual([
        ids.D,
        ids.C,
        ids.E,
        ids.A,
        ids.B,
      ]);
    });

    it('desde posterior a hasta → 400 con el error en hasta', async () => {
      const respuesta = await como(tokenOperador, 'get', '/api/v1/pagos')
        .query({ desde: hoy, hasta: diasAntes(hoy, 1) })
        .expect(400);
      expect(JSON.stringify(respuesta.body.details)).toContain('hasta');
    });

    it('el CLIENTE no lista los pagos del personal → 403', async () => {
      await como(tokenCliente, 'get', '/api/v1/pagos').expect(403);
    });
  });
});
