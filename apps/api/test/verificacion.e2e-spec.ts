import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { fechaEnGuayaquil } from '@oasis/shared';
import { hash } from 'argon2';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import {
  REGISTRO_RECIBOS,
  type RegistroRecibosPort,
} from '../src/modules/recibos/application/ports/registro-recibos.port';
import { WorkerModule } from '../src/worker.module';
import { cedulaValida } from './identificaciones';
import { crearPolizaDePrueba } from './polizas-de-prueba';

/**
 * HU-28 de punta a punta: los cinco resultados de la verificación (D2), el CLIENTE con RN-07 y
 * un recibo ajeno indistinguible de uno inexistente (D3), y el límite de 30 por minuto (D4).
 * El worker se arranca solo cuando un caso necesita un recibo anclado.
 */
describe('Verificación de recibos (e2e)', () => {
  let app: NestExpressApplication;
  let worker: INestApplicationContext | undefined;
  let prisma: PrismaService;
  let tokenOperador: string;
  let tokenAdmin: string;
  let tokenCliente: string;
  let tokenOtroCliente: string;
  let contadorIp = 0;
  const sufijo = Date.now();
  const PASSWORD = 'Prueba.Oasis1';
  const INEXISTENTE = 'RC-FFFFFFFFFFFF';

  function ip(): string {
    contadorIp += 1;
    return `198.18.${Math.trunc(contadorIp / 250) % 250}.${(contadorIp % 250) + 1}`;
  }

  function como(token: string, metodo: 'get' | 'post' | 'patch', ruta: string) {
    return request(app.getHttpServer())
      [metodo](ruta)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${token}`);
  }

  const verificar = (token: string, codigo: string) =>
    como(token, 'get', `/api/v1/recibos/${codigo}/verificacion`);

  async function login(email: string, password: string): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email, password })
      .expect(200);
    return respuesta.body.accessToken as string;
  }

  async function usuarioNuevo(rol: 'OPERADOR' | 'CLIENTE', clienteId?: string): Promise<string> {
    const usuario = await prisma.usuario.create({
      data: {
        email: `verificacion.${rol.toLowerCase()}.${randomUUID().slice(0, 8)}@example.com`,
        passwordHash: await hash(PASSWORD),
        nombre: `Verificación ${rol}`,
        rol,
        clienteId,
      },
    });
    return login(usuario.email, PASSWORD);
  }

  /** Recibo PENDIENTE_ANCLAJE de una póliza propia del cliente del seed. */
  async function emitirRecibo(): Promise<{ id: string; codigo: string }> {
    const polizaId = await crearPolizaDePrueba(prisma);
    const pago = await como(tokenOperador, 'post', '/api/v1/pagos')
      .send({
        polizaId,
        monto: '45.75',
        fechaPago: fechaEnGuayaquil(new Date()),
        metodo: 'TRANSFERENCIA',
        referencia: randomUUID(),
      })
      .expect(201);
    const validado = await como(
      tokenOperador,
      'patch',
      `/api/v1/pagos/${pago.body.id as string}/validar`,
    )
      .send({ confirmado: true })
      .expect(200);
    return { id: validado.body.recibo.id as string, codigo: validado.body.recibo.codigo as string };
  }

  async function emitirAnclado(): Promise<{ id: string; codigo: string }> {
    worker ??= await NestFactory.createApplicationContext(WorkerModule, { logger: false });
    const recibo = await emitirRecibo();
    const limite = Date.now() + 150_000;
    while (Date.now() < limite) {
      const { estado } = await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } });
      if (estado === 'ANCLADO') return recibo;
      if (estado === 'FALLIDO') throw new Error(`El recibo ${recibo.codigo} quedó FALLIDO`);
      await new Promise((r) => setTimeout(r, 1_000));
    }
    throw new Error(`El recibo ${recibo.codigo} no se ancló a tiempo`);
  }

  /** Lo que un recibo ajeno e uno inexistente deben compartir: todo salvo el código pedido y la hora. */
  const sinCodigoNiHora = (cuerpo: Record<string, unknown>) => ({
    ...cuerpo,
    codigo: '<codigo>',
    verificadoEn: '<hora>',
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();
    prisma = app.get(PrismaService);

    tokenOperador = await login('operador@oasis.com', 'Operador.Oasis1');
    tokenAdmin = await login('admin@oasis.com', 'Admin.Oasis1');
    tokenCliente = await login('cliente@oasis.com', 'Cliente.Oasis1');
    const otroCliente = await como(tokenOperador, 'post', '/api/v1/clientes')
      .send({
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo + 2828),
        nombres: 'Otro',
        apellidos: 'Verificador',
        email: `otro.verificador.${sufijo}@example.com`,
      })
      .expect(201);
    tokenOtroCliente = await usuarioNuevo('CLIENTE', otroCliente.body.id as string);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await worker?.close();
    await app?.close();
  });

  it('sin sesión → 401 (HU-28.1)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/recibos/${INEXISTENTE}/verificacion`)
      .set('X-Forwarded-For', ip())
      .expect(401);
  });

  it('un recibo emitido que aún no está en la cadena → EN_PROCESO (HU-28.3)', async () => {
    const recibo = await emitirRecibo();

    const respuesta = await verificar(tokenOperador, recibo.codigo).expect(200);

    expect(respuesta.body).toMatchObject({
      codigo: recibo.codigo,
      estado: 'EN_PROCESO',
      hashOnchain: null,
      txHash: null,
      explorerUrl: null,
    });
  });

  it('un código inexistente → 200 NO_ENCONTRADO (HU-28.3)', async () => {
    const respuesta = await verificar(tokenOperador, INEXISTENTE).expect(200);

    expect(respuesta.body).toMatchObject({
      codigo: INEXISTENTE,
      estado: 'NO_ENCONTRADO',
      hashRecibo: `0x${'0'.repeat(64)}`,
      txHash: null,
      explorerUrl: null,
    });
  });

  it('un recibo anclado → AUTENTICO con el hash de la cadena y el enlace al explorador (HU-28.2, HU-28.4)', async () => {
    const recibo = await emitirAnclado();
    const enBase = await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } });

    const respuesta = await verificar(tokenOperador, recibo.codigo).expect(200);

    expect(respuesta.body).toMatchObject({
      codigo: recibo.codigo,
      estado: 'AUTENTICO',
      hashRecibo: enBase.hashRecibo,
      hashOnchain: enBase.hashRecibo,
      txHash: enBase.txHash,
      contractAddress: expect.stringMatching(/^0x[0-9a-fA-F]{40}$/),
    });
    expect(respuesta.body.explorerUrl).toMatch(new RegExp(`/tx/${enBase.txHash as string}$`));
  });

  it('un recibo anclado cuyo payload se alteró en la base → NO_COINCIDE (HU-28.2)', async () => {
    const recibo = await emitirAnclado();
    const enBase = await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } });
    const alterado = enBase.payloadCanonico.replace('45.75', '4575.00');
    expect(alterado).not.toBe(enBase.payloadCanonico);
    await prisma.recibo.update({ where: { id: recibo.id }, data: { payloadCanonico: alterado } });

    const respuesta = await verificar(tokenOperador, recibo.codigo).expect(200);

    expect(respuesta.body.estado).toBe('NO_COINCIDE');
    expect(respuesta.body.hashOnchain).toBe(enBase.hashRecibo);
    expect(respuesta.body.hashRecibo).not.toBe(enBase.hashRecibo);
  });

  it('un recibo anclado y luego anulado → ANULADO (HU-28.3)', async () => {
    const recibo = await emitirAnclado();
    await como(tokenAdmin, 'post', `/api/v1/recibos/${recibo.id}/anular`).expect(200);

    const respuesta = await verificar(tokenOperador, recibo.codigo).expect(200);

    expect(respuesta.body.estado).toBe('ANULADO');
  });

  it('el CLIENTE dueño ve AUTENTICO sin el hash de la cadena ni el contrato (HU-28.5, D5)', async () => {
    const recibo = await emitirAnclado();

    const respuesta = await verificar(tokenCliente, recibo.codigo).expect(200);

    expect(respuesta.body.estado).toBe('AUTENTICO');
    expect(respuesta.body.explorerUrl).toEqual(expect.stringContaining('/tx/0x'));
    expect(respuesta.body).not.toHaveProperty('hashOnchain');
    expect(respuesta.body).not.toHaveProperty('contractAddress');
  });

  it('para otro CLIENTE el recibo ajeno responde igual que uno inexistente y sin consultar la cadena (RN-07, D3)', async () => {
    const recibo = await emitirAnclado();
    const registro = app.get<RegistroRecibosPort>(REGISTRO_RECIBOS, { strict: false });
    const consulta = jest.spyOn(registro, 'obtenerEnCadena');

    const ajeno = await verificar(tokenOtroCliente, recibo.codigo);
    const inexistente = await verificar(tokenOtroCliente, INEXISTENTE);

    expect(ajeno.status).toBe(200);
    expect(inexistente.status).toBe(200);
    expect(ajeno.body).toMatchObject({ codigo: recibo.codigo, estado: 'NO_ENCONTRADO' });
    expect(sinCodigoNiHora(ajeno.body)).toEqual(sinCodigoNiHora(inexistente.body));
    expect(Object.keys(ajeno.body).sort()).toEqual(Object.keys(inexistente.body).sort());
    expect(consulta).not.toHaveBeenCalled();
    consulta.mockRestore();
  });

  it('la consulta 31 del mismo usuario en un minuto → 429 DEMASIADAS_CONSULTAS con Retry-After; otro usuario sigue (HU-28.6, D4)', async () => {
    const token = await usuarioNuevo('OPERADOR');

    for (let consulta = 1; consulta <= 30; consulta += 1) {
      await verificar(token, INEXISTENTE).expect(200);
    }
    const bloqueada = await verificar(token, INEXISTENTE).expect(429);

    expect(Number(bloqueada.headers['retry-after'])).toBeGreaterThan(0);
    expect(Number(bloqueada.headers['retry-after'])).toBeLessThanOrEqual(60);
    expect(bloqueada.body).toMatchObject({
      statusCode: 429,
      code: 'DEMASIADAS_CONSULTAS',
      details: {
        motivo: 'DEMASIADAS_CONSULTAS',
        reintentarEnSegundos: Number(bloqueada.headers['retry-after']),
      },
      requestId: expect.any(String),
      timestamp: expect.any(String),
      path: `/api/v1/recibos/${INEXISTENTE}/verificacion`,
    });
    await verificar(tokenOperador, INEXISTENTE).expect(200);
  });

  it('un código con formato inválido → 400 VALIDACION', async () => {
    const respuesta = await verificar(tokenOperador, 'NO-ES-UN-CODIGO').expect(400);
    expect(respuesta.body.code).toBe('VALIDACION');
  });
});
