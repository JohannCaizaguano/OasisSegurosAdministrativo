import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { fechaEnGuayaquil } from '@oasis/shared';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
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

    const misPagos = await como(
      tokenCliente,
      'get',
      '/api/v1/mis-pagos?page=1&pageSize=100',
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

    const misPagos = await como(
      tokenCliente,
      'get',
      '/api/v1/mis-pagos?page=1&pageSize=100',
    ).expect(200);
    const porId = new Map(
      (misPagos.body.data as Array<{ id: string; rechazadoEn: string | null }>).map((p) => [
        p.id,
        p,
      ]),
    );
    expect(porId.get(rechazado.body.id as string)?.rechazadoEn).toEqual(expect.any(String));
    expect(porId.get(validado.body.id as string)?.rechazadoEn).toBeNull();
  });
});
