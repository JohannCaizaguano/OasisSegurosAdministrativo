import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.module';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID = '22222222-2222-4222-8222-222222222222';

/**
 * `GET /health` y `x-request-id` de extremo a extremo contra los servicios
 * reales (PostgreSQL y Redis de `compose.dev.yaml`). El caso 503 se provoca
 * sustituyendo el cliente de Redis por uno que falla: así la prueba del
 * contrato no depende de detener un contenedor.
 */
describe('GET /health (e2e)', () => {
  let app: INestApplication;
  let appSinRedis: INestApplication;

  beforeAll(async () => {
    const [modulo, moduloSinRedis] = await Promise.all([
      Test.createTestingModule({ imports: [AppModule] }).compile(),
      Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(REDIS_CLIENT)
        .useValue({ ping: () => Promise.reject(new Error('conexión rehusada')) })
        .compile(),
    ]);

    app = modulo.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    appSinRedis = moduloSinRedis.createNestApplication({ logger: false });
    appSinRedis.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await appSinRedis.init();
  });

  afterAll(async () => {
    await app?.close();
    await appSinRedis?.close();
  });

  it('informa 200 con PostgreSQL y Redis arriba', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(respuesta.body.status).toBe('ok');
    expect(respuesta.body.info.database.status).toBe('up');
    expect(respuesta.body.info.redis.status).toBe('up');
    // Sin datos sensibles: ni cadenas de conexión ni versiones internas.
    const texto = JSON.stringify(respuesta.body);
    expect(texto).not.toMatch(/postgres(ql)?:\/\//);
    expect(texto).not.toMatch(/redis:\/\//);
  });

  it('responde 503 con el detalle por componente cuando Redis falla', async () => {
    const respuesta = await request(appSinRedis.getHttpServer()).get('/api/v1/health');

    expect(respuesta.status).toBe(503);
    const texto = JSON.stringify(respuesta.body);
    expect(texto).toMatch(/redis/);
    expect(texto).toMatch(/down/);
  });

  it('genera un x-request-id cuando la petición no lo trae', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(respuesta.headers['x-request-id']).toMatch(UUID_RE);
  });

  it('conserva el x-request-id entrante cuando es un UUID válido', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', REQUEST_ID)
      .expect(200);

    expect(respuesta.headers['x-request-id']).toBe(REQUEST_ID);
  });

  it('descarta un x-request-id que no es UUID y genera uno propio', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'no-es-un-uuid')
      .expect(200);

    expect(respuesta.headers['x-request-id']).not.toBe('no-es-un-uuid');
    expect(respuesta.headers['x-request-id']).toMatch(UUID_RE);
  });

  it('incluye el requestId en el cuerpo de las respuestas de error', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/ruta-inexistente')
      .set('x-request-id', REQUEST_ID)
      .expect(404);

    expect(respuesta.body.requestId).toBe(REQUEST_ID);
    expect(respuesta.body.statusCode).toBe(404);
    expect(respuesta.body.code).toBe('HTTP_404');
    expect(respuesta.body.path).toBe('/api/v1/ruta-inexistente');
    expect(respuesta.body.timestamp).toEqual(expect.any(String));
  });
});
