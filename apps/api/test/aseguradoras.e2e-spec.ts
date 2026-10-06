import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { rucSociedad } from './identificaciones';

/**
 * E2E de HU-11 (aseguradoras): RUC de 13 dígitos validado, duplicado, edición y
 * permisos por rol (D14). Requiere PostgreSQL migrado y el seed cargado.
 */
describe('Aseguradoras (e2e)', () => {
  let app: NestExpressApplication;
  let tokenAdmin: string;
  let tokenOperador: string;

  const sufijo = Date.now();
  const ID_CUALQUIERA = '00000000-0000-4000-8000-000000000000';
  let contadorIp = 0;

  function ip(): string {
    contadorIp += 1;
    return `198.20.${(contadorIp % 250) + 1}.${(contadorIp % 200) + 1}`;
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

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'admin@oasis.com', password: 'Admin.Oasis1' })
      .expect(200);
    tokenAdmin = loginAdmin.body.accessToken as string;

    const loginOperador = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'operador@oasis.com', password: 'Operador.Oasis1' })
      .expect(200);
    tokenOperador = loginOperador.body.accessToken as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('el ADMIN crea una aseguradora con RUC de 13 dígitos (HU-11.1)', async () => {
    const respuesta = await conToken(tokenAdmin, '/api/v1/aseguradoras', 'post')
      .send({ nombre: `Aseguradora E2E ${sufijo}`, ruc: rucSociedad(sufijo) })
      .expect(201);

    expect(respuesta.body).toMatchObject({
      nombre: `Aseguradora E2E ${sufijo}`,
      ruc: rucSociedad(sufijo),
    });
    expect(respuesta.body.createdAt).toBeTruthy();
  });

  it('rechaza un RUC duplicado (HU-11.2)', async () => {
    const ruc = rucSociedad(sufijo + 1);
    await conToken(tokenAdmin, '/api/v1/aseguradoras', 'post')
      .send({ nombre: `Duplicada ${sufijo}`, ruc })
      .expect(201);

    const respuesta = await conToken(tokenAdmin, '/api/v1/aseguradoras', 'post')
      .send({ nombre: `Duplicada otra ${sufijo}`, ruc })
      .expect(409);

    expect(respuesta.body.message).toBe('Ya existe una aseguradora con ese RUC');
    expect(respuesta.body.details).toEqual({ campo: 'ruc', motivo: 'RUC_DUPLICADO' });
  });

  it('el ADMIN edita el nombre y la lista lo refleja (HU-11.3)', async () => {
    const creada = await conToken(tokenAdmin, '/api/v1/aseguradoras', 'post')
      .send({ nombre: `Antes ${sufijo}`, ruc: rucSociedad(sufijo + 2) })
      .expect(201);
    const id = creada.body.id as string;

    const actualizada = await conToken(tokenAdmin, `/api/v1/aseguradoras/${id}`, 'patch')
      .send({ nombre: `Después ${sufijo}` })
      .expect(200);
    expect(actualizada.body.nombre).toBe(`Después ${sufijo}`);

    const listado = await conToken(
      tokenAdmin,
      `/api/v1/aseguradoras?page=1&pageSize=100&q=${encodeURIComponent(`Después ${sufijo}`)}`,
    ).expect(200);
    expect(listado.body.data.map((fila: { id: string }) => fila.id)).toContain(id);
  });

  it('el OPERADOR lista pero no crea ni edita (D14)', async () => {
    await conToken(tokenOperador, '/api/v1/aseguradoras?page=1&pageSize=20').expect(200);

    await conToken(tokenOperador, '/api/v1/aseguradoras', 'post')
      .send({ nombre: 'No permitida', ruc: rucSociedad(sufijo + 3) })
      .expect(403);

    await conToken(tokenOperador, `/api/v1/aseguradoras/${ID_CUALQUIERA}`, 'patch')
      .send({ nombre: 'No permitida' })
      .expect(403);
  });

  it('rechaza un RUC de 12 dígitos', async () => {
    const respuesta = await conToken(tokenAdmin, '/api/v1/aseguradoras', 'post')
      .send({ nombre: 'RUC Corto', ruc: '179001234500' })
      .expect(400);

    expect(respuesta.body.code).toBe('VALIDACION');
    expect(JSON.stringify(respuesta.body.details)).toContain('ruc');
  });
});
