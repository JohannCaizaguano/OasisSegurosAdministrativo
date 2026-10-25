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
});
