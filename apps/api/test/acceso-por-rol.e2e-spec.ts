import type { NestExpressApplication } from '@nestjs/platform-express';
import { RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Rol } from '@oasis/shared';
import { ROLES } from '@oasis/shared';
import { hash } from 'argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import type { RutaDeclarada } from './rutas-declaradas';
import { rutasDeclaradas } from './rutas-declaradas';

/**
 * Matriz de acceso por rol (HU-03, ADR-015): toda ruta no pública exige token y
 * cada rol no permitido recibe 403. Descubre las rutas del grafo de `AppModule`.
 */
describe('Acceso por rol (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const RUTAS = rutasDeclaradas().filter((ruta) => !ruta.esPublica);
  const ID_CUALQUIERA = '00000000-0000-4000-8000-000000000000';
  const VERBOS: Record<number, 'get' | 'post' | 'put' | 'patch' | 'delete'> = {
    [RequestMethod.GET]: 'get',
    [RequestMethod.POST]: 'post',
    [RequestMethod.PUT]: 'put',
    [RequestMethod.PATCH]: 'patch',
    [RequestMethod.DELETE]: 'delete',
  };

  const tokens = {} as Record<Rol, string>;
  let contadorIp = 0;
  const PASSWORD = 'Prueba.Oasis1';

  function ip(): string {
    contadorIp += 1;
    return `203.0.113.${(contadorIp % 250) + 1}`;
  }

  // Los guards corren antes que los pipes: no hacen falta parámetros ni cuerpos válidos.
  function peticion(ruta: RutaDeclarada) {
    const verbo = VERBOS[ruta.metodo];
    return request(app.getHttpServer())
      [verbo](ruta.ruta.replace(/:[^/]+/g, ID_CUALQUIERA))
      .set('X-Forwarded-For', ip());
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    prisma = app.get(PrismaService);

    const credenciales: Record<Rol, { email: string; password: string }> = {
      ADMIN: { email: 'admin@oasis.com', password: 'Admin.Oasis1' },
      OPERADOR: { email: 'operador@oasis.com', password: 'Operador.Oasis1' },
      CLIENTE: { email: 'cliente@oasis.com', password: 'Cliente.Oasis1' },
    };
    for (const rol of ROLES) {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', ip())
        .send(credenciales[rol])
        .expect(200);
      tokens[rol] = login.body.accessToken as string;
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each(RUTAS.map((ruta) => [ruta.clave, ruta] as const))(
    '%s exige token',
    async (_clave, ruta) => {
      await peticion(ruta).expect(401);
    },
  );

  const PROHIBIDAS = RUTAS.flatMap((ruta) =>
    ROLES.filter((rol) => !ruta.roles.includes(rol)).map(
      (rol) => [`${ruta.clave} con ${rol}`, ruta, rol] as const,
    ),
  );

  it.each(PROHIBIDAS)('%s responde 403', async (_nombre, ruta, rol) => {
    await peticion(ruta).set('Authorization', `Bearer ${tokens[rol]}`).expect(403);
  });

  it('la matriz cubre las rutas nuevas y no la retirada (HU-08 a HU-14, D13)', () => {
    const claves = RUTAS.map((ruta) => ruta.clave);
    const rutas = RUTAS.map((ruta) => ruta.ruta);

    expect(rutas).toEqual(
      expect.arrayContaining([
        '/api/v1/ramos',
        '/api/v1/clientes/:id/desactivar',
        '/api/v1/clientes/:id/reactivar',
        '/api/v1/polizas/:id/estado',
      ]),
    );
    expect(claves).not.toContain('PolizasController.eliminar');
  });

  it('el CLIENTE solo obtiene sus pólizas y pagos', async () => {
    const sufijo = Date.now();
    const aseguradora = await prisma.aseguradora.findFirstOrThrow();
    const ramo = await prisma.ramo.findUniqueOrThrow({ where: { codigo: 'VEHICULOS' } });
    const metodo = await prisma.metodoPago.findUniqueOrThrow({
      where: { codigo: 'TRANSFERENCIA' },
    });

    const otroCliente = await prisma.cliente.create({
      data: {
        tipoIdentificacion: 'PASAPORTE',
        identificacion: `E2E-${sufijo}`,
        nombres: 'Otro',
        apellidos: 'Cliente',
        email: `otro.${sufijo}@example.com`,
      },
    });
    const otroUsuario = await prisma.usuario.create({
      data: {
        email: `cliente2.${sufijo}@example.com`,
        passwordHash: await hash(PASSWORD),
        nombre: 'Otro Cliente',
        rol: 'CLIENTE',
        clienteId: otroCliente.id,
      },
    });
    const hoy = new Date();
    const poliza = await prisma.poliza.create({
      data: {
        numero: `POL-E2E-${sufijo}`,
        clienteId: otroCliente.id,
        aseguradoraId: aseguradora.id,
        ramoId: ramo.id,
        primaTotal: '100.00',
        fechaInicio: new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1)),
        fechaFin: new Date(Date.UTC(hoy.getUTCFullYear() + 1, hoy.getUTCMonth(), 0)),
        estado: 'VIGENTE',
      },
    });
    await prisma.pago.create({
      data: {
        polizaId: poliza.id,
        monto: '50.00',
        fechaPago: hoy,
        metodoPagoId: metodo.id,
        referencia: `E2E-${sufijo}`,
        estado: 'REGISTRADO',
      },
    });

    const loginOtro = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: otroUsuario.email, password: PASSWORD })
      .expect(200);
    const tokenOtro = loginOtro.body.accessToken as string;

    const polizasDelSeed = await request(app.getHttpServer())
      .get('/api/v1/mis-polizas?page=1&pageSize=50')
      .set('Authorization', `Bearer ${tokens.CLIENTE}`)
      .expect(200);
    const polizasDelOtro = await request(app.getHttpServer())
      .get('/api/v1/mis-polizas?page=1&pageSize=50')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .expect(200);

    const numerosSeed = polizasDelSeed.body.data.map((p: { numero: string }) => p.numero);
    const numerosOtro = polizasDelOtro.body.data.map((p: { numero: string }) => p.numero);
    expect(numerosSeed).not.toContain(poliza.numero);
    expect(numerosOtro).toContain(poliza.numero);
    expect(numerosOtro).not.toContain('POL-2026-0001');

    const pagosDelSeed = await request(app.getHttpServer())
      .get('/api/v1/mis-pagos?page=1&pageSize=50')
      .set('Authorization', `Bearer ${tokens.CLIENTE}`)
      .expect(200);
    const pagosDelOtro = await request(app.getHttpServer())
      .get('/api/v1/mis-pagos?page=1&pageSize=50')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .expect(200);

    const polizasDePagosSeed = pagosDelSeed.body.data.map((p: { polizaId: string }) => p.polizaId);
    const polizasDePagosOtro = pagosDelOtro.body.data.map((p: { polizaId: string }) => p.polizaId);
    expect(polizasDePagosSeed).not.toContain(poliza.id);
    expect(polizasDePagosOtro).toContain(poliza.id);

    // La matriz ya cubre 403 en /recibos, /recibos/:id y /recibos/:codigo/verificacion.
    await request(app.getHttpServer())
      .get(`/api/v1/recibos/${ID_CUALQUIERA}/verificacion`)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${tokenOtro}`)
      .expect(403);
  });
});
