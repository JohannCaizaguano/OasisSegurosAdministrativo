import { getQueueToken } from '@nestjs/bullmq';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { fechaEnGuayaquil, reciboImprimibleSchema } from '@oasis/shared';
import { hash } from 'argon2';
import type { Queue } from 'bullmq';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import {
  COLA_ANCLAJE_RECIBOS,
  JOB_ANCLAR_RECIBO,
} from '../src/infrastructure/queue/queue.constants';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import {
  COLA_ANCLAJE,
  type ColaAnclajePort,
} from '../src/modules/recibos/application/ports/cola-anclaje.port';
import { cedulaValida } from './identificaciones';
import { crearPolizaDePrueba } from './polizas-de-prueba';

/**
 * HU-25 (imprimible sin datos internos, D6 y D7) y HU-26 (reintento del ADMIN, D10) de punta a
 * punta. Sin worker: los recibos quedan PENDIENTE_ANCLAJE y el estado FALLIDO se fuerza en la base
 * sobre recibos propios de la prueba.
 */
describe('Recibos: detalle, imprimible y reintento (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let cola: Queue;
  let tokenOperador: string;
  let tokenAdmin: string;
  let tokenCliente: string;
  let tokenOtroCliente: string;
  let adminId: string;
  let contadorIp = 0;
  const sufijo = Date.now();
  const ID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';
  const CLAVES_INTERNAS = [
    'sal',
    'payloadCanonico',
    'hashRecibo',
    'idOnchain',
    'id',
    'pagoId',
    'polizaId',
    'clienteId',
    'identificacion',
    'email',
    'intentos',
    'ultimoError',
  ];

  function ip(): string {
    contadorIp += 1;
    return `198.19.0.${(contadorIp % 250) + 1}`;
  }

  function como(token: string, metodo: 'get' | 'post' | 'patch', ruta: string) {
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

  async function emitirRecibo(): Promise<{ id: string; codigo: string; pagoId: string }> {
    const polizaId = await crearPolizaDePrueba(prisma);
    const pago = await como(tokenOperador, 'post', '/api/v1/pagos')
      .send({
        polizaId,
        monto: '75.20',
        fechaPago: fechaEnGuayaquil(new Date()),
        metodo: 'TRANSFERENCIA',
        referencia: `REF-${randomUUID().slice(0, 8)}`,
      })
      .expect(201);
    const validado = await como(
      tokenOperador,
      'patch',
      `/api/v1/pagos/${pago.body.id as string}/validar`,
    )
      .send({ confirmado: true })
      .expect(200);
    return {
      id: validado.body.recibo.id as string,
      codigo: validado.body.recibo.codigo as string,
      pagoId: pago.body.id as string,
    };
  }

  /** Fuerza un estado sobre un recibo propio y retira su job para que ningún worker lo toque. */
  async function forzarEstado(reciboId: string, estado: 'FALLIDO' | 'ANCLADO'): Promise<void> {
    await app.get<ColaAnclajePort>(COLA_ANCLAJE, { strict: false }).desencolarAnclaje(reciboId);
    await prisma.recibo.update({
      where: { id: reciboId },
      data: { estado, ultimoError: estado === 'FALLIDO' ? 'RPC caído (forzado e2e)' : null },
    });
  }

  /** Recorre el cuerpo y devuelve toda clave interna que aparezca a cualquier profundidad. */
  function clavesInternas(valor: unknown): string[] {
    if (Array.isArray(valor)) return valor.flatMap(clavesInternas);
    if (valor && typeof valor === 'object') {
      return Object.entries(valor).flatMap(([clave, hijo]) => [
        ...(CLAVES_INTERNAS.includes(clave) ? [clave] : []),
        ...clavesInternas(hijo),
      ]);
    }
    return [];
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();
    prisma = app.get(PrismaService);
    cola = app.get<Queue>(getQueueToken(COLA_ANCLAJE_RECIBOS), { strict: false });

    tokenOperador = await login('operador@oasis.com', 'Operador.Oasis1');
    tokenAdmin = await login('admin@oasis.com', 'Admin.Oasis1');
    tokenCliente = await login('cliente@oasis.com', 'Cliente.Oasis1');
    adminId = (await prisma.usuario.findUniqueOrThrow({ where: { email: 'admin@oasis.com' } })).id;

    const otro = await como(tokenOperador, 'post', '/api/v1/clientes')
      .send({
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo + 2525),
        nombres: 'Otro',
        apellidos: 'Imprimible',
        email: `otro.imprimible.${sufijo}@example.com`,
      })
      .expect(201);
    const usuario = await prisma.usuario.create({
      data: {
        email: `otro.imprimible.usuario.${sufijo}@example.com`,
        passwordHash: await hash('Prueba.Oasis1'),
        nombre: 'Otro Imprimible',
        rol: 'CLIENTE',
        clienteId: otro.body.id as string,
      },
    });
    tokenOtroCliente = await login(usuario.email, 'Prueba.Oasis1');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('el detalle del recibo no expone el payload canónico ni la sal (D6)', async () => {
    const recibo = await emitirRecibo();

    const detalle = await como(tokenOperador, 'get', `/api/v1/recibos/${recibo.id}`).expect(200);

    expect(detalle.body).toMatchObject({ id: recibo.id, codigo: recibo.codigo });
    expect(detalle.body).not.toHaveProperty('payloadCanonico');
    expect(detalle.body).not.toHaveProperty('sal');
    const enBase = await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } });
    expect(JSON.stringify(detalle.body)).not.toContain(enBase.sal);
  });

  it('el imprimible del personal trae póliza, monto, fecha, código y estado, sin datos internos (HU-25.1, HU-25.4)', async () => {
    const recibo = await emitirRecibo();
    const enBase = await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } });

    const respuesta = await como(
      tokenOperador,
      'get',
      `/api/v1/recibos/${recibo.id}/imprimible`,
    ).expect(200);

    expect(() => reciboImprimibleSchema.parse(respuesta.body)).not.toThrow();
    expect(respuesta.body).toMatchObject({
      codigo: recibo.codigo,
      estadoAnclaje: 'PENDIENTE_ANCLAJE',
      ancladoEn: null,
      explorerUrl: null,
      pago: {
        monto: '75.20',
        fechaPago: fechaEnGuayaquil(new Date()),
        metodo: 'TRANSFERENCIA',
      },
      poliza: { ramo: 'Vehículos' },
      cliente: {
        nombre: expect.stringContaining('Cabrera'),
        identificacionEnmascarada: '******4065',
      },
    });
    expect(respuesta.body.poliza.numero).toMatch(/^POL-E2E-/);
    expect(clavesInternas(respuesta.body)).toEqual([]);
    const texto = JSON.stringify(respuesta.body);
    expect(texto).not.toContain('1710034065');
    expect(texto).not.toContain(enBase.sal);
    expect(texto).not.toContain(enBase.hashRecibo);
  });

  it('el CLIENTE dueño obtiene el mismo imprimible; uno ajeno o inexistente → 404 (HU-25, RN-07)', async () => {
    const recibo = await emitirRecibo();
    const personal = await como(
      tokenOperador,
      'get',
      `/api/v1/recibos/${recibo.id}/imprimible`,
    ).expect(200);

    const propio = await como(
      tokenCliente,
      'get',
      `/api/v1/mis-recibos/${recibo.id}/imprimible`,
    ).expect(200);
    const ajeno = await como(
      tokenOtroCliente,
      'get',
      `/api/v1/mis-recibos/${recibo.id}/imprimible`,
    ).expect(404);
    const inexistente = await como(
      tokenOtroCliente,
      'get',
      `/api/v1/mis-recibos/${ID_INEXISTENTE}/imprimible`,
    ).expect(404);

    expect(propio.body).toEqual(personal.body);
    expect(ajeno.body.code).toBe('NO_ENCONTRADO');
    expect(inexistente.body.code).toBe(ajeno.body.code);
    await como(tokenCliente, 'get', `/api/v1/recibos/${recibo.id}/imprimible`).expect(403);
  });

  it('el ADMIN reintenta un FALLIDO: vuelve a PENDIENTE_ANCLAJE, se encola y la bitácora dice quién (HU-26)', async () => {
    const recibo = await emitirRecibo();
    await forzarEstado(recibo.id, 'FALLIDO');

    const respuesta = await como(
      tokenAdmin,
      'post',
      `/api/v1/recibos/${recibo.id}/reintentar`,
    ).expect(200);

    expect(respuesta.body).toMatchObject({ id: recibo.id, estado: 'PENDIENTE_ANCLAJE' });
    const job = await cola.getJob(recibo.id);
    expect(job?.name).toBe(JOB_ANCLAR_RECIBO);
    expect(job?.data).toEqual({ reciboId: recibo.id });
    const fila = await prisma.bitacoraAuditoria.findFirstOrThrow({
      where: { accion: 'REINTENTAR', entidad: 'Recibo', entidadId: recibo.id },
    });
    expect(fila.usuarioId).toBe(adminId);

    // D10: el detalle lee «Último reintento» con este filtro de la bitácora.
    const bitacora = await como(tokenAdmin, 'get', '/api/v1/bitacora')
      .query({ entidad: 'Recibo', entidadId: recibo.id, accion: 'REINTENTAR', pageSize: 1 })
      .expect(200);
    expect(bitacora.body.meta.total).toBe(1);
    expect(bitacora.body.data[0]).toMatchObject({
      accion: 'REINTENTAR',
      entidad: 'Recibo',
      entidadId: recibo.id,
      usuarioEmail: 'admin@oasis.com',
      creadoEn: expect.any(String),
    });
  });

  it('el filtro de la bitácora por entidad excluye los registros de otros recibos (D10)', async () => {
    const recibo = await emitirRecibo();

    const bitacora = await como(tokenAdmin, 'get', '/api/v1/bitacora')
      .query({ entidad: 'Recibo', entidadId: recibo.id, accion: 'REINTENTAR' })
      .expect(200);

    expect(bitacora.body.meta.total).toBe(0);
    expect(bitacora.body.data).toEqual([]);
  });

  it('reintentar un recibo ANCLADO → 422 y no se audita (HU-26.1)', async () => {
    const recibo = await emitirRecibo();
    await forzarEstado(recibo.id, 'ANCLADO');

    await como(tokenAdmin, 'post', `/api/v1/recibos/${recibo.id}/reintentar`).expect(422);

    expect(
      await prisma.bitacoraAuditoria.count({
        where: { accion: 'REINTENTAR', entidadId: recibo.id },
      }),
    ).toBe(0);
  });

  it('el OPERADOR no puede reintentar → 403 y el recibo sigue FALLIDO (HU-26.1)', async () => {
    const recibo = await emitirRecibo();
    await forzarEstado(recibo.id, 'FALLIDO');

    await como(tokenOperador, 'post', `/api/v1/recibos/${recibo.id}/reintentar`).expect(403);

    const enBase = await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } });
    expect(enBase.estado).toBe('FALLIDO');
  });
});
