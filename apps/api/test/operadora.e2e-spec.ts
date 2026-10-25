import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type Redis from 'ioredis';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.module';

/** HU-42 (D17): el API solo lee la llave que publica el worker; solo el ADMIN la ve. */
describe('Saldo de la cuenta operadora (e2e)', () => {
  let app: NestExpressApplication;
  let redis: Redis;
  let tokenAdmin: string;
  let tokenOperador: string;
  let contadorIp = 0;
  let respaldo: string | null;

  function ip(): string {
    contadorIp += 1;
    return `192.0.2.${(contadorIp % 250) + 1}`;
  }

  async function login(email: string, password: string): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email, password })
      .expect(200);
    return respuesta.body.accessToken as string;
  }

  const consultar = (token: string) =>
    request(app.getHttpServer())
      .get('/api/v1/operadora/saldo')
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();
    redis = app.get(REDIS_CLIENT);
    // La llave puede venir de un worker de desarrollo: se guarda y se restaura.
    respaldo = await redis.get('operadora:saldo');
    tokenAdmin = await login('admin@oasis.com', 'Admin.Oasis1');
    tokenOperador = await login('operador@oasis.com', 'Operador.Oasis1');
  });

  afterAll(async () => {
    if (respaldo) await redis.set('operadora:saldo', respaldo, 'EX', 900);
    await app?.close();
  });

  it('con la llave escrita por el worker devuelve el saldo y la alerta', async () => {
    await redis.set(
      'operadora:saldo',
      JSON.stringify({
        wei: '400000000000000000',
        pol: '0.4',
        umbralPol: '0.5',
        bajoUmbral: true,
        actualizadoEn: '2026-10-24T15:00:00.000Z',
      }),
      'EX',
      60,
    );

    const respuesta = await consultar(tokenAdmin).expect(200);

    expect(respuesta.body).toEqual({
      disponible: true,
      pol: '0.4',
      umbralPol: '0.5',
      bajoUmbral: true,
      actualizadoEn: '2026-10-24T15:00:00.000Z',
    });
  });

  it('sin llave responde { disponible: false }', async () => {
    await redis.del('operadora:saldo');
    const respuesta = await consultar(tokenAdmin).expect(200);
    expect(respuesta.body).toEqual({ disponible: false });
  });

  it('el OPERADOR recibe 403', async () => {
    await consultar(tokenOperador).expect(403);
  });
});
