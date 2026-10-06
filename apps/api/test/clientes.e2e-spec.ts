import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cedulaValida, rucSociedad } from './identificaciones';

/**
 * E2E de HU-07 (registro de cliente): RN-11, duplicados con mensaje claro, campos
 * obligatorios y fecha de creación. Requiere PostgreSQL migrado y el seed cargado.
 */
describe('Clientes (e2e)', () => {
  let app: NestExpressApplication;
  let tokenOperador: string;

  const sufijo = Date.now();
  let contadorIp = 0;

  function ip(): string {
    contadorIp += 1;
    return `198.19.${(contadorIp % 250) + 1}.${(contadorIp % 200) + 1}`;
  }

  function crearCliente(datos: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${tokenOperador}`)
      .send(datos);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'operador@oasis.com', password: 'Operador.Oasis1' })
      .expect(200);
    tokenOperador = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registra cédula, RUC y pasaporte válidos con su fecha de creación (HU-07.1 y HU-07.4)', async () => {
    const casos = [
      {
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo),
        nombres: 'Ana',
        apellidos: 'Pérez',
        email: `cliente.cedula.${sufijo}@example.com`,
      },
      {
        tipoIdentificacion: 'RUC',
        identificacion: rucSociedad(sufijo),
        razonSocial: `Sociedad E2E ${sufijo}`,
        email: `cliente.ruc.${sufijo}@example.com`,
      },
      {
        tipoIdentificacion: 'PASAPORTE',
        identificacion: `E2E${sufijo}`,
        nombres: 'Pas',
        apellidos: 'Porte',
        email: `cliente.pas.${sufijo}@example.com`,
      },
    ];

    for (const datos of casos) {
      const respuesta = await crearCliente(datos).expect(201);
      expect(respuesta.body.identificacion).toBe(datos.identificacion);
      expect(respuesta.body.createdAt).toBeTruthy();
      expect(Number.isNaN(Date.parse(respuesta.body.createdAt as string))).toBe(false);
    }
  });

  it('rechaza una cédula con verificador inválido y un RUC sin 001 (HU-07.1)', async () => {
    const cedula = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion: '1712345678',
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: `cliente.invalida.${sufijo}@example.com`,
    }).expect(400);
    expect(JSON.stringify(cedula.body.details)).toContain('identificacion');

    const ruc = await crearCliente({
      tipoIdentificacion: 'RUC',
      identificacion: '1790012345002',
      razonSocial: 'Sociedad Inválida',
      email: `cliente.ruc.invalido.${sufijo}@example.com`,
    }).expect(400);
    expect(JSON.stringify(ruc.body.details)).toContain('identificacion');
  });

  it('rechaza una identificación duplicada con un mensaje claro (HU-07.2)', async () => {
    const identificacion = cedulaValida(sufijo + 1);
    const base = {
      tipoIdentificacion: 'CEDULA',
      identificacion,
      nombres: 'Duplicada',
      apellidos: 'Prueba',
    };
    await crearCliente({ ...base, email: `duplicada.1.${sufijo}@example.com` }).expect(201);

    const respuesta = await crearCliente({
      ...base,
      email: `duplicada.2.${sufijo}@example.com`,
    }).expect(409);

    expect(respuesta.body.message).toBe('Ya existe un cliente con esa identificación');
    expect(respuesta.body.details).toEqual({
      campo: 'identificacion',
      motivo: 'IDENTIFICACION_DUPLICADA',
    });
  });

  it('exige nombres con cédula y razón social con RUC (HU-07.3)', async () => {
    const cedula = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion: cedulaValida(sufijo + 2),
      email: `sin.nombres.${sufijo}@example.com`,
    }).expect(400);
    expect(JSON.stringify(cedula.body.details)).toContain('nombres');

    const ruc = await crearCliente({
      tipoIdentificacion: 'RUC',
      identificacion: rucSociedad(sufijo + 2),
      email: `sin.razon.${sufijo}@example.com`,
    }).expect(400);
    expect(JSON.stringify(ruc.body.details)).toContain('razonSocial');
  });

  it('DELETE /clientes/:id ya no existe (RN-09)', async () => {
    const creado = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion: cedulaValida(sufijo + 3),
      nombres: 'Sin',
      apellidos: 'Borrado',
      email: `sin.borrado.${sufijo}@example.com`,
    }).expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/clientes/${creado.body.id as string}`)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${tokenOperador}`)
      .expect(404);
  });
});
