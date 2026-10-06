import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

/**
 * E2E de HU-04 (usuarios del personal): alta con contraseña temporal, unicidad del correo,
 * desactivación con cierre de sesiones, reactivación y restablecimiento. Requiere PostgreSQL
 * con las migraciones aplicadas y el seed cargado.
 */
describe('Usuarios del personal (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let tokenAdmin: string;
  let adminId: string;

  const sufijo = Date.now();
  let contadorIp = 0;
  let contador = 0;

  function ip(): string {
    contadorIp += 1;
    return `198.18.${(contadorIp % 250) + 1}.${(contadorIp % 200) + 1}`;
  }

  function correoNuevo(etiqueta: string): string {
    contador += 1;
    return `e2e.usuarios.${sufijo}.${contador}.${etiqueta}@example.com`;
  }

  function comoAdmin(peticion: request.Test): request.Test {
    return peticion.set('X-Forwarded-For', ip()).set('Authorization', `Bearer ${tokenAdmin}`);
  }

  async function crearUsuario(datos: { email: string; nombre: string; rol: string }) {
    const respuesta = await comoAdmin(request(app.getHttpServer()).post('/api/v1/usuarios'))
      .send(datos)
      .expect(201);
    return respuesta.body as {
      usuario: {
        id: string;
        email: string;
        nombre: string;
        rol: string;
        activo: boolean;
        createdAt: string;
      };
      contrasenaTemporal: string;
    };
  }

  function iniciarSesion(email: string, password: string) {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email, password });
  }

  function conToken(token: string, ruta: string, metodo: 'get' | 'post' | 'patch' = 'get') {
    return request(app.getHttpServer())
      [metodo](ruta)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${token}`);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    prisma = app.get(PrismaService);

    const login = await iniciarSesion('admin@oasis.com', 'Admin.Oasis1').expect(200);
    tokenAdmin = login.body.accessToken as string;
    adminId = login.body.usuario.id as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('crea un operador con contraseña temporal y el operador inicia sesión (HU-04.1)', async () => {
    const email = correoNuevo('alta');
    const creado = await crearUsuario({ email, nombre: 'Operador E2E', rol: 'OPERADOR' });

    expect(creado.contrasenaTemporal).toMatch(/^[A-Za-z0-9]{16}$/);
    expect(creado.usuario).not.toHaveProperty('passwordHash');
    expect(creado.usuario).toMatchObject({
      email,
      nombre: 'Operador E2E',
      rol: 'OPERADOR',
      activo: true,
    });
    expect(creado.usuario.createdAt).toBeTruthy();

    const login = await iniciarSesion(email, creado.contrasenaTemporal).expect(200);
    expect(login.body.usuario.nombre).toBe('Operador E2E');
  });

  it('rechaza un correo repetido con 409 en el campo email (HU-04.2)', async () => {
    const respuesta = await comoAdmin(request(app.getHttpServer()).post('/api/v1/usuarios'))
      .send({ email: 'admin@oasis.com', nombre: 'Duplicado', rol: 'OPERADOR' })
      .expect(409);

    expect(respuesta.body.details).toEqual({ campo: 'email', motivo: 'CORREO_DUPLICADO' });
    expect(JSON.stringify(respuesta.body)).not.toContain('passwordHash');
  });

  it('rechaza crear una cuenta con rol CLIENTE', async () => {
    const respuesta = await comoAdmin(request(app.getHttpServer()).post('/api/v1/usuarios'))
      .send({ email: correoNuevo('cliente'), nombre: 'No permitido', rol: 'CLIENTE' })
      .expect(400);

    expect(respuesta.body.code).toBe('VALIDACION');
    expect(JSON.stringify(respuesta.body.details)).toContain('rol');
  });

  it('desactivar cierra la sesión abierta y bloquea el login (HU-04.3 y deuda S3)', async () => {
    const email = correoNuevo('baja');
    const { usuario, contrasenaTemporal } = await crearUsuario({
      email,
      nombre: 'Operador Baja',
      rol: 'OPERADOR',
    });
    const login = await iniciarSesion(email, contrasenaTemporal).expect(200);
    const tokenOperador = login.body.accessToken as string;

    await conToken(tokenOperador, '/api/v1/auth/me').expect(200);
    const desactivado = await comoAdmin(
      request(app.getHttpServer()).post(`/api/v1/usuarios/${usuario.id}/desactivar`),
    ).expect(200);
    expect(desactivado.body.activo).toBe(false);

    await conToken(tokenOperador, '/api/v1/auth/me').expect(401);
    const reintento = await iniciarSesion(email, contrasenaTemporal);
    expect(reintento.status).toBe(401);
    expect(reintento.body.message).not.toMatch(/inactivo/i);
  });

  it('reactivar permite volver a iniciar sesión', async () => {
    const email = correoNuevo('reactivar');
    const { usuario, contrasenaTemporal } = await crearUsuario({
      email,
      nombre: 'Operador Reactivado',
      rol: 'OPERADOR',
    });
    await comoAdmin(
      request(app.getHttpServer()).post(`/api/v1/usuarios/${usuario.id}/desactivar`),
    ).expect(200);
    await iniciarSesion(email, contrasenaTemporal).expect(401);

    const reactivado = await comoAdmin(
      request(app.getHttpServer()).post(`/api/v1/usuarios/${usuario.id}/reactivar`),
    ).expect(200);
    expect(reactivado.body.activo).toBe(true);

    await iniciarSesion(email, contrasenaTemporal).expect(200);
  });

  it('restablecer invalida la contraseña vieja, cierra la sesión y devuelve la nueva (HU-04.4)', async () => {
    const email = correoNuevo('reset');
    const { usuario, contrasenaTemporal } = await crearUsuario({
      email,
      nombre: 'Operador Reset',
      rol: 'OPERADOR',
    });
    const login = await iniciarSesion(email, contrasenaTemporal).expect(200);
    const tokenViejo = login.body.accessToken as string;

    const reset = await comoAdmin(
      request(app.getHttpServer()).post(`/api/v1/usuarios/${usuario.id}/restablecer-contrasena`),
    ).expect(200);
    const nueva = reset.body.contrasenaTemporal as string;
    expect(nueva).toMatch(/^[A-Za-z0-9]{16}$/);
    expect(nueva).not.toBe(contrasenaTemporal);

    await iniciarSesion(email, contrasenaTemporal).expect(401);
    await iniciarSesion(email, nueva).expect(200);
    await conToken(tokenViejo, '/api/v1/auth/me').expect(401);
  });

  it('cambiar el rol cierra las sesiones del usuario', async () => {
    const email = correoNuevo('rol');
    const { usuario, contrasenaTemporal } = await crearUsuario({
      email,
      nombre: 'Operador a Admin',
      rol: 'OPERADOR',
    });
    const login = await iniciarSesion(email, contrasenaTemporal).expect(200);
    const tokenOperador = login.body.accessToken as string;

    const actualizado = await comoAdmin(
      request(app.getHttpServer()).patch(`/api/v1/usuarios/${usuario.id}`),
    )
      .send({ rol: 'ADMIN' })
      .expect(200);
    expect(actualizado.body.rol).toBe('ADMIN');

    await conToken(tokenOperador, '/api/v1/auth/me').expect(401);
  });

  it('el ADMIN no puede desactivarse a sí mismo', async () => {
    const respuesta = await comoAdmin(
      request(app.getHttpServer()).post(`/api/v1/usuarios/${adminId}/desactivar`),
    ).expect(422);

    expect(respuesta.body.details).toEqual({ motivo: 'AUTO_MODIFICACION' });
  });

  it('no permite degradar al último administrador activo', async () => {
    const objetivo = await prisma.usuario.create({
      data: {
        email: correoNuevo('ultimo-admin'),
        passwordHash: 'hash-de-prueba',
        nombre: 'Último Admin',
        rol: 'ADMIN',
      },
    });
    // La sesión del actor sigue viva en Redis aunque su fila quede inactiva.
    const otrosActivos = await prisma.usuario.findMany({
      where: { rol: 'ADMIN', activo: true, id: { not: objetivo.id } },
      select: { id: true },
    });
    await prisma.usuario.updateMany({
      where: { id: { in: otrosActivos.map((usuario) => usuario.id) } },
      data: { activo: false },
    });
    try {
      const respuesta = await comoAdmin(
        request(app.getHttpServer()).patch(`/api/v1/usuarios/${objetivo.id}`),
      )
        .send({ rol: 'OPERADOR' })
        .expect(422);
      expect(respuesta.body.details).toEqual({ motivo: 'ULTIMO_ADMIN' });
    } finally {
      await prisma.usuario.updateMany({
        where: { id: { in: otrosActivos.map((usuario) => usuario.id) } },
        data: { activo: true },
      });
    }
  });

  it('la bitácora registra las acciones sin guardar la contraseña temporal', async () => {
    const email = correoNuevo('bitacora');
    const { usuario, contrasenaTemporal } = await crearUsuario({
      email,
      nombre: 'Operador Bitácora',
      rol: 'OPERADOR',
    });
    await comoAdmin(
      request(app.getHttpServer()).post(`/api/v1/usuarios/${usuario.id}/desactivar`),
    ).expect(200);
    await comoAdmin(
      request(app.getHttpServer()).post(`/api/v1/usuarios/${usuario.id}/reactivar`),
    ).expect(200);
    const reset = await comoAdmin(
      request(app.getHttpServer()).post(`/api/v1/usuarios/${usuario.id}/restablecer-contrasena`),
    ).expect(200);

    const filas = await prisma.bitacoraAuditoria.findMany({
      where: { entidad: 'Usuario', entidadId: usuario.id },
      orderBy: { creadoEn: 'asc' },
    });
    expect(filas.map((fila) => fila.accion)).toEqual([
      'CREAR',
      'DESACTIVAR',
      'REACTIVAR',
      'RESTABLECER_CONTRASENA',
    ]);
    const detalles = JSON.stringify(filas.map((fila) => fila.detalle));
    expect(detalles).not.toContain(contrasenaTemporal);
    expect(detalles).not.toContain(reset.body.contrasenaTemporal);
  });

  it('GET /usuarios no incluye cuentas CLIENTE', async () => {
    const respuesta = await comoAdmin(
      request(app.getHttpServer()).get('/api/v1/usuarios?page=1&pageSize=100'),
    ).expect(200);

    const filas = respuesta.body.data as Array<{ email: string; rol: string }>;
    expect(filas.length).toBeGreaterThan(0);
    expect(filas.every((fila) => fila.rol !== 'CLIENTE')).toBe(true);
    expect(filas.some((fila) => fila.email === 'cliente@oasis.com')).toBe(false);
    expect(filas.every((fila) => !('passwordHash' in fila))).toBe(true);
  });
});
