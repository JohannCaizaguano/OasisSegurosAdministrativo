import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { TTL_SESION_SEGUNDOS } from '@oasis/shared';
import { hash } from 'argon2';
import cookieParser from 'cookie-parser';
import type { Response } from 'supertest';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.module';
import type Redis from 'ioredis';

/**
 * E2E de autenticación (HU-01, HU-02, HU-06): sesiones por familia en Redis,
 * renovación, revocación y cambio de contraseña. Requiere PostgreSQL, Redis,
 * contrato desplegado y seed cargado.
 */
describe('Autenticación (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let redis: Redis;

  const PASSWORD = 'Prueba.Oasis1';
  let contadorIp = 0;
  let contadorUsuario = 0;

  /** IP propia por petición: el límite de 5 inicios/min por IP no cruza pruebas (D25). */
  function ip(): string {
    contadorIp += 1;
    return `198.51.100.${(contadorIp % 250) + 1}`;
  }

  async function crearUsuario(rol: 'ADMIN' | 'OPERADOR' | 'CLIENTE', activo = true) {
    contadorUsuario += 1;
    return prisma.usuario.create({
      data: {
        email: `e2e.auth.${Date.now()}.${contadorUsuario}@example.com`,
        passwordHash: await hash(PASSWORD),
        nombre: `Usuario E2E ${contadorUsuario}`,
        rol,
        activo,
      },
    });
  }

  function cookieDe(respuesta: Response): string {
    const cabeceras = respuesta.headers['set-cookie'] as unknown;
    const lista = Array.isArray(cabeceras) ? cabeceras : [cabeceras];
    for (const cabecera of lista) {
      const coincide = /oasis_refresh=([^;]+)/.exec(String(cabecera));
      if (coincide) {
        return coincide[1];
      }
    }
    throw new Error('La respuesta no trae la cookie oasis_refresh');
  }

  function payloadDe(jwt: string): { sid: string; exp: number; jti?: string } {
    const [, cuerpo] = jwt.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8')) as {
      sid: string;
      exp: number;
      jti?: string;
    };
  }

  function claveSesion(usuarioId: string, sid: string): string {
    return `sesion:${usuarioId}:${sid}`;
  }

  async function iniciarSesion(email: string, password = PASSWORD) {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email, password })
      .expect(200);
    return {
      accessToken: respuesta.body.accessToken as string,
      usuarioId: respuesta.body.usuario.id as string,
      cookie: cookieDe(respuesta),
    };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(REDIS_CLIENT);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('con credenciales válidas emite el access token y la cookie httpOnly de renovación', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'admin@oasis.com', password: 'Admin.Oasis1' })
      .expect(200);

    expect(typeof respuesta.body.accessToken).toBe('string');
    expect(respuesta.body.usuario.rol).toBe('ADMIN');

    const cookie = (respuesta.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookie).toContain('oasis_refresh=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api/v1/auth');
  });

  it('con credenciales inválidas responde el mismo mensaje genérico', async () => {
    const inactivo = await crearUsuario('OPERADOR', false);

    const incorrecta = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'operador@oasis.com', password: 'No.Es.La.Clave1' })
      .expect(401);
    const inexistente = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'nadie@oasis.com', password: PASSWORD })
      .expect(401);
    const sinActivar = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: inactivo.email, password: PASSWORD })
      .expect(401);

    expect(incorrecta.body.message).toBe('Credenciales inválidas');
    expect(inexistente.body.message).toBe(incorrecta.body.message);
    expect(sinActivar.body.message).toBe(incorrecta.body.message);
  });

  it('el sexto intento en un minuto desde la misma IP devuelve 429', async () => {
    const ipFija = ip();
    let ultima;
    for (let intento = 0; intento < 6; intento += 1) {
      ultima = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', ipFija)
        .send({ email: 'operador@oasis.com', password: 'No.Es.La.Clave1' });
    }

    expect(ultima?.status).toBe(429);
    expect(ultima?.body.message).toContain('Demasiadas solicitudes');
  });

  it('renueva la sesión con la cookie y conserva el vencimiento absoluto', async () => {
    const sesion = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');
    const original = payloadDe(sesion.cookie);

    // `iat` del JWT tiene resolución de segundo: renovar en el mismo segundo daría un token idéntico.
    await new Promise((resolver) => setTimeout(resolver, 1_100));

    const refresco = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${sesion.cookie}`)
      .expect(200);

    expect(refresco.body.accessToken).not.toBe(sesion.accessToken);
    const nuevo = payloadDe(cookieDe(refresco));
    expect(nuevo.sid).toBe(original.sid);
    expect(nuevo.exp).toBe(original.exp);
  });

  it('reutilizar una cookie ya rotada cierra esa sesión', async () => {
    const sesion = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');
    const refresco = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${sesion.cookie}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${sesion.cookie}`)
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${refresco.body.accessToken as string}`)
      .expect(401);
  });

  it('guarda las contraseñas con argon2id', async () => {
    const admin = await prisma.usuario.findUniqueOrThrow({ where: { email: 'admin@oasis.com' } });

    expect(admin.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it('dos inicios de sesión del mismo usuario conviven', async () => {
    const primera = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');
    const segunda = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${primera.cookie}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${segunda.accessToken}`)
      .expect(200);
  });

  it('cerrar sesión invalida en el servidor la renovación y el access token', async () => {
    const sesion = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');

    const antes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sesion.accessToken}`)
      .expect(200);
    expect(antes.headers['cache-control']).toBe('no-store');

    const cierre = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${sesion.cookie}`)
      .expect(204);
    const cookieLimpia = (cierre.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookieLimpia).toMatch(/oasis_refresh=;|Expires=Thu, 01 Jan 1970/);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${sesion.cookie}`)
      .expect(401);
    const despues = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sesion.accessToken}`)
      .expect(401);
    // El rechazo del guard tampoco queda en caché.
    expect(despues.headers['cache-control']).toBe('no-store');
  });

  it('cerrar sesión en un equipo no cierra la del otro', async () => {
    const primera = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');
    const segunda = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${primera.cookie}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${segunda.accessToken}`)
      .expect(200);
  });

  it('rechaza la contraseña actual incorrecta en su campo', async () => {
    const usuario = await crearUsuario('OPERADOR');
    const sesion = await iniciarSesion(usuario.email);

    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/cambiar-contrasena')
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${sesion.accessToken}`)
      .send({ actual: 'No.Es.La.Actual1', nueva: 'Nueva.Clave1' })
      .expect(400);

    expect(respuesta.body.code).toBe('VALIDACION');
    expect(respuesta.body.details[0].path).toEqual(['actual']);
  });

  it('rechaza una contraseña nueva de menos de 8 caracteres o igual a la actual', async () => {
    const usuario = await crearUsuario('OPERADOR');
    const sesion = await iniciarSesion(usuario.email);

    await request(app.getHttpServer())
      .post('/api/v1/auth/cambiar-contrasena')
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${sesion.accessToken}`)
      .send({ actual: PASSWORD, nueva: '1234567' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/cambiar-contrasena')
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${sesion.accessToken}`)
      .send({ actual: PASSWORD, nueva: PASSWORD })
      .expect(400);
  });

  it('cambia la contraseña, mantiene la sesión actual y cierra las demás al instante', async () => {
    const usuario = await crearUsuario('OPERADOR');
    const sesionA = await iniciarSesion(usuario.email);
    const sesionB = await iniciarSesion(usuario.email);
    const NUEVA = 'Nueva.Clave1';

    await request(app.getHttpServer())
      .post('/api/v1/auth/cambiar-contrasena')
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${sesionA.accessToken}`)
      .send({ actual: PASSWORD, nueva: NUEVA })
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sesionA.accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sesionB.accessToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${sesionB.cookie}`)
      .expect(401);

    await iniciarSesion(usuario.email, NUEVA);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: usuario.email, password: PASSWORD })
      .expect(401);

    const actualizado = await prisma.usuario.findUniqueOrThrow({ where: { id: usuario.id } });
    expect(actualizado.passwordHash.startsWith('$argon2id$')).toBe(true);

    const bitacora = await prisma.bitacoraAuditoria.findFirstOrThrow({
      where: { accion: 'MODIFICAR', entidad: 'Usuario', entidadId: usuario.id },
      orderBy: { creadoEn: 'desc' },
    });
    expect(bitacora.detalle).toMatchObject({ campos: ['actual', 'nueva'] });
  });

  it('cada petición renueva el TTL de 31 minutos de la sesión', async () => {
    const sesion = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');
    const sid = payloadDe(sesion.accessToken).sid;
    const clave = claveSesion(sesion.usuarioId, sid);

    const ttlInicial = await redis.ttl(clave);
    expect(ttlInicial).toBeGreaterThan(1_800);
    expect(ttlInicial).toBeLessThanOrEqual(TTL_SESION_SEGUNDOS);

    await redis.expire(clave, 30);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sesion.accessToken}`)
      .expect(200);

    const ttlRenovado = await redis.ttl(clave);
    expect(ttlRenovado).toBeGreaterThan(1_800);
  });

  it('una sesión vencida en el servidor rechaza el access token y la renovación', async () => {
    const sesion = await iniciarSesion('operador@oasis.com', 'Operador.Oasis1');
    const sid = payloadDe(sesion.accessToken).sid;
    await redis.del(claveSesion(sesion.usuarioId, sid));

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sesion.accessToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', ip())
      .set('Cookie', `oasis_refresh=${sesion.cookie}`)
      .expect(401);
  });
});
