import type { INestApplication, INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { WorkerModule } from '../src/worker.module';

/**
 * E2E del flujo completo (login → validar → anclaje → verificación pública);
 * requiere infraestructura y contrato desplegado.
 */
describe('Flujo de anclaje (e2e)', () => {
  let app: INestApplication;
  let worker: INestApplicationContext;
  let prisma: PrismaService;
  let token: string;
  let polizaId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    // Worker in-process: procesa la cola real de BullMQ con la cuenta operadora.
    worker = await NestFactory.createApplicationContext(WorkerModule, { logger: false });

    prisma = app.get(PrismaService);
    const poliza = await prisma.poliza.findFirstOrThrow({ where: { estado: 'VIGENTE' } });
    polizaId = poliza.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'operador@oasis.com', password: 'Operador.Oasis1' })
      .expect(200);
    token = login.body.accessToken as string;
  });

  afterAll(async () => {
    await worker?.close();
    await app?.close();
  });

  it('ancla el recibo y lo verifica con la sesión del operador', async () => {
    const crear = await request(app.getHttpServer())
      .post('/api/v1/pagos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        polizaId,
        monto: '45.75',
        fechaPago: new Date().toISOString().slice(0, 10),
        metodo: 'TRANSFERENCIA',
        referencia: `E2E-${Date.now()}`,
      })
      .expect(201);

    const validar = await request(app.getHttpServer())
      .patch(`/api/v1/pagos/${crear.body.id}/validar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmado: true, nota: 'e2e' })
      .expect(200);

    expect(validar.body.pago.estado).toBe('VALIDADO');
    expect(validar.body.recibo.estado).toBe('PENDIENTE_ANCLAJE');
    const reciboId = validar.body.recibo.id as string;
    const codigo = validar.body.recibo.codigo as string;

    const auditoriaValidar = await prisma.bitacoraAuditoria.findFirstOrThrow({
      where: { accion: 'VALIDAR', entidad: 'Pago', entidadId: crear.body.id as string },
    });
    expect(auditoriaValidar.entidadId).toBe(crear.body.id);

    let detalle: Record<string, unknown> = {};
    const limite = Date.now() + 90_000;
    while (Date.now() < limite) {
      const resp = await request(app.getHttpServer())
        .get(`/api/v1/recibos/${reciboId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      detalle = resp.body;
      if (['ANCLADO', 'FALLIDO', 'ANULADO'].includes(detalle.estado as string)) {
        break;
      }
      await new Promise((r) => setTimeout(r, 1_500));
    }

    expect(detalle.estado).toBe('ANCLADO');
    expect(detalle.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(detalle.blockNumber).toMatch(/^\d+$/);
    expect(detalle.ancladoEn).toBeTruthy();

    const verificacion = await request(app.getHttpServer())
      .get(`/api/v1/recibos/${codigo}/verificacion`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(verificacion.body.estado).toBe('VALIDO');
    expect(verificacion.body.hashOnchain).toBe(detalle.hashRecibo);
    expect(verificacion.body.txHash).toBe(detalle.txHash);
    expect(verificacion.body.explorerUrl).toContain(detalle.txHash as string);
  });

  it('la verificación no expone datos personales', async () => {
    const recibo = await prisma.recibo.findFirstOrThrow({
      where: { estado: 'ANCLADO' },
      orderBy: { creadoEn: 'desc' },
    });

    const verificacion = await request(app.getHttpServer())
      .get(`/api/v1/recibos/${recibo.codigo}/verificacion`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const texto = JSON.stringify(verificacion.body);
    expect(texto).not.toContain('@');
    expect(texto).not.toContain('Cabrera');
    expect(texto).not.toContain('1710034065');
    expect(verificacion.body).not.toHaveProperty('clienteId');
    expect(verificacion.body).not.toHaveProperty('monto');
  });
});
