import type { INestApplication, INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { fechaEnGuayaquil, registroRecibosAbi } from '@oasis/shared';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createPublicClient, getAddress, http } from 'viem';
import { hardhat } from 'viem/chains';

import { AppModule } from '../src/app.module';
import { AppConfig } from '../src/config/app.config';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { WorkerModule } from '../src/worker.module';
import { crearPolizaDePrueba } from './polizas-de-prueba';

const RECIBOS = 10;

/** Espera por condición (R4): sondea la base, nunca un tiempo fijo. */
async function esperarHasta(condicion: () => Promise<boolean>, plazoMs: number): Promise<void> {
  const limite = Date.now() + plazoMs;
  while (!(await condicion())) {
    if (Date.now() > limite) throw new Error('La condición no se cumplió a tiempo');
    await new Promise((listo) => setTimeout(listo, 100));
  }
}

/**
 * HU-23.5 (escenario EC-04): si el worker se detiene a mitad del anclaje y vuelve a arrancar,
 * cada recibo queda anclado una sola vez en el contrato.
 */
describe('Reinicio del worker durante el anclaje (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  const reciboIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();
    prisma = app.get(PrismaService);
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'operador@oasis.com', password: 'Operador.Oasis1' })
      .expect(200);
    token = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('ancla los 10 recibos una sola vez aunque el worker se cierre y vuelva a arrancar', async () => {
    const polizaId = await crearPolizaDePrueba(prisma, { prima: '1000.00' });
    for (let i = 0; i < RECIBOS; i += 1) {
      const pago = await request(app.getHttpServer())
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          polizaId,
          monto: '10.00',
          fechaPago: fechaEnGuayaquil(new Date()),
          metodo: 'DEBITO_BANCARIO',
          referencia: randomUUID(),
        })
        .expect(201);
      const validado = await request(app.getHttpServer())
        .patch(`/api/v1/pagos/${pago.body.id as string}/validar`)
        .set('Authorization', `Bearer ${token}`)
        .send({ confirmado: true })
        .expect(200);
      reciboIds.push(validado.body.recibo.id as string);
    }

    const primero = await NestFactory.createApplicationContext(WorkerModule, { logger: false });
    await esperarHasta(
      async () =>
        (await prisma.recibo.count({
          where: { id: { in: reciboIds }, estado: { in: ['ENVIADO', 'ANCLADO'] } },
        })) > 0,
      60_000,
    );
    await primero.close();

    const segundo: INestApplicationContext = await NestFactory.createApplicationContext(
      WorkerModule,
      { logger: false },
    );
    try {
      await esperarHasta(
        async () =>
          (await prisma.recibo.count({ where: { id: { in: reciboIds }, estado: 'ANCLADO' } })) ===
          RECIBOS,
        150_000,
      );
    } finally {
      await segundo.close();
    }

    const recibos = await prisma.recibo.findMany({ where: { id: { in: reciboIds } } });
    const config = app.get(AppConfig);
    const cliente = createPublicClient({
      chain: hardhat,
      transport: http(config.blockchain.rpcUrl),
    });
    for (const recibo of recibos) {
      expect(recibo.intentos).toBeLessThanOrEqual(5);
      const eventos = await cliente.getContractEvents({
        address: getAddress(recibo.contractAddress),
        abi: registroRecibosAbi,
        eventName: 'ReciboRegistrado',
        args: { idRecibo: recibo.idOnchain as `0x${string}` },
        fromBlock: 0n,
      });
      expect(eventos).toHaveLength(1);
    }
  });
});
