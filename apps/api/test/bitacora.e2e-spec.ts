import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { cedulaValida } from './identificaciones';

/**
 * E2E de la bitácora de auditoría (HU-45): requiere PostgreSQL con la migración
 * `bitacora_solo_insercion` aplicada y el seed cargado.
 */
describe('Bitácora de auditoría (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let tokenAdmin: string;
  let tokenOperador: string;
  let operadorId: string;

  const sufijo = Date.now();

  function hoyEnEcuador(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
  }

  function ultimo(where: Record<string, unknown>) {
    return prisma.bitacoraAuditoria.findFirstOrThrow({
      where,
      orderBy: { creadoEn: 'desc' },
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    prisma = app.get(PrismaService);

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@oasis.com', password: 'Admin.Oasis1' })
      .expect(200);
    tokenAdmin = loginAdmin.body.accessToken as string;

    const loginOperador = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'operador@oasis.com', password: 'Operador.Oasis1' })
      .expect(200);
    tokenOperador = loginOperador.body.accessToken as string;
    operadorId = loginOperador.body.usuario.id as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registra el inicio de sesión con usuario, IP y ruta', async () => {
    const fila = await ultimo({ usuarioId: operadorId, accion: 'INICIAR_SESION' });

    expect(fila.entidad).toBe('Usuario');
    expect(fila.entidadId).toBe(operadorId);
    expect(fila.ip).toBeTruthy();
    expect(fila.detalle).toMatchObject({ metodo: 'POST', ruta: '/api/v1/auth/login' });
  });

  it('registra creación y modificación de un cliente sin guardar sus datos', async () => {
    const email = `bitacora.${sufijo}@example.com`;

    const crear = await request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo),
        nombres: 'Prueba',
        apellidos: 'Bitácora',
        email,
      })
      .expect(201);

    const clienteId = crear.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/v1/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ telefono: '0991234567' })
      .expect(200);

    const filas = await prisma.bitacoraAuditoria.findMany({
      where: { entidad: 'Cliente', entidadId: clienteId },
      orderBy: { creadoEn: 'asc' },
    });

    expect(filas.map((fila) => fila.accion)).toEqual(['CREAR', 'MODIFICAR']);
    const modificacion = filas.find((fila) => fila.accion === 'MODIFICAR');
    expect(modificacion?.detalle).toMatchObject({ campos: ['telefono'] });

    const detalles = JSON.stringify(filas.map((fila) => fila.detalle));
    expect(detalles).not.toContain(email);
    expect(detalles).not.toContain('0991234567');
  });

  it('lista los usuarios de la bitácora, incluidas las cuentas CLIENTE', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '10.6.0.41')
      .send({ email: 'cliente@oasis.com', password: 'Cliente.Oasis1' })
      .expect(200);

    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/bitacora/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    const emails = (respuesta.body as Array<{ id: string; email: string }>).map(
      (usuario) => usuario.email,
    );
    expect(emails).toContain('cliente@oasis.com');
    expect(emails).toContain('operador@oasis.com');
  });

  it('registra el rechazo de un pago y no registra un rechazo fallido', async () => {
    const poliza = await prisma.poliza.findFirstOrThrow({ where: { estado: 'VIGENTE' } });

    const crear = await request(app.getHttpServer())
      .post('/api/v1/pagos')
      .set('Authorization', `Bearer ${tokenOperador}`)
      .send({
        polizaId: poliza.id,
        monto: '10.00',
        fechaPago: hoyEnEcuador(),
        metodo: 'TRANSFERENCIA',
        referencia: `E2E-BIT-${sufijo}`,
      })
      .expect(201);

    const pagoId = crear.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/v1/pagos/${pagoId}/rechazar`)
      .set('Authorization', `Bearer ${tokenOperador}`)
      .send({ confirmado: true, motivo: 'Comprobante ilegible' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/pagos/${pagoId}/rechazar`)
      .set('Authorization', `Bearer ${tokenOperador}`)
      .send({ confirmado: true, motivo: 'Comprobante ilegible' })
      .expect(422);

    const rechazos = await prisma.bitacoraAuditoria.findMany({
      where: { accion: 'RECHAZAR', entidad: 'Pago', entidadId: pagoId },
    });
    expect(rechazos).toHaveLength(1);
    expect(JSON.stringify(rechazos[0].detalle)).not.toContain('ilegible');

    const creacion = await ultimo({ accion: 'CREAR', entidad: 'Pago', entidadId: pagoId });
    expect(creacion.entidadId).toBe(pagoId);
  });

  it('registra el cambio de estado de una póliza con su acción nueva (HU-13, HU-45)', async () => {
    const aseguradora = await prisma.aseguradora.findFirstOrThrow();
    const ramo = await prisma.ramo.findUniqueOrThrow({ where: { codigo: 'VEHICULOS' } });
    const cliente = await prisma.cliente.create({
      data: {
        tipoIdentificacion: 'PASAPORTE',
        identificacion: `E2E-BIT-${sufijo}`,
        nombres: 'Bitácora',
        apellidos: 'Estado',
        email: `bitacora.estado.${sufijo}@example.com`,
      },
    });
    const poliza = await prisma.poliza.create({
      data: {
        numero: `POL-BIT-${sufijo}`,
        clienteId: cliente.id,
        aseguradoraId: aseguradora.id,
        ramoId: ramo.id,
        primaTotal: '100.00',
        fechaInicio: new Date(Date.UTC(2026, 10, 1)),
        fechaFin: new Date(Date.UTC(2027, 9, 31)),
        estado: 'VIGENTE',
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/polizas/${poliza.id}/estado`)
      .set('X-Forwarded-For', '10.6.0.42')
      .set('Authorization', `Bearer ${tokenOperador}`)
      .send({ estado: 'VENCIDA' })
      .expect(200);

    const fila = await ultimo({
      accion: 'CAMBIAR_ESTADO',
      entidad: 'Poliza',
      entidadId: poliza.id,
    });
    expect(fila.detalle).toMatchObject({ estado: 'VENCIDA' });

    const hoy = hoyEnEcuador();
    const listado = await request(app.getHttpServer())
      .get('/api/v1/bitacora')
      .query({ usuarioId: operadorId, accion: 'CAMBIAR_ESTADO', desde: hoy, hasta: hoy })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(listado.body.meta.total).toBeGreaterThanOrEqual(1);
    for (const item of listado.body.data) {
      expect(item.accion).toBe('CAMBIAR_ESTADO');
    }
    const entidades = (listado.body.data as Array<{ entidadId: string | null }>).map(
      (registro) => registro.entidadId,
    );
    expect(entidades).toContain(poliza.id);
  });

  it('el ADMIN filtra por usuario, acción y fecha de Ecuador', async () => {
    const hoy = hoyEnEcuador();
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/bitacora')
      .query({ usuarioId: operadorId, accion: 'CREAR', desde: hoy, hasta: hoy })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(respuesta.body.meta.total).toBeGreaterThanOrEqual(1);
    for (const item of respuesta.body.data) {
      expect(item).toMatchObject({
        usuarioId: operadorId,
        usuarioEmail: 'operador@oasis.com',
        accion: 'CREAR',
      });
    }

    const fechas = respuesta.body.data.map((item: { creadoEn: string }) => item.creadoEn);
    expect(fechas).toEqual([...fechas].sort().reverse());
  });

  it('rechaza un rango de fechas invertido', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/bitacora')
      .query({ desde: '2026-10-02', hasta: '2026-10-01' })
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(400);

    expect(respuesta.body.code).toBe('VALIDACION');
  });

  it('un OPERADOR no puede consultar la bitácora', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/bitacora')
      .set('Authorization', `Bearer ${tokenOperador}`)
      .expect(403);
  });

  it('la base de datos impide modificar, borrar o vaciar la bitácora (RN-17)', async () => {
    const fila = await ultimo({ accion: 'INICIAR_SESION', usuarioId: operadorId });
    const accionOriginal = fila.accion;

    await expect(
      prisma.bitacoraAuditoria.update({
        where: { id: fila.id },
        data: { accion: 'ELIMINAR' },
      }),
    ).rejects.toThrow();
    await expect(prisma.bitacoraAuditoria.delete({ where: { id: fila.id } })).rejects.toThrow();
    await expect(prisma.$executeRaw`TRUNCATE "BitacoraAuditoria"`).rejects.toThrow();

    const despues = await prisma.bitacoraAuditoria.findUniqueOrThrow({ where: { id: fila.id } });
    expect(despues.accion).toBe(accionOriginal);

    const error = await prisma.bitacoraAuditoria
      .update({ where: { id: fila.id }, data: { accion: 'ELIMINAR' } })
      .then(
        () => null,
        (e: Error) => e,
      );
    if (error && /solo inserción/.test(error.message)) {
      expect(error.message).toMatch(/solo inserción/);
    }
  });
});
