import { NestFactory } from '@nestjs/core';
import { createServer } from 'node:http';
import { Logger } from 'nestjs-pino';

import { AppConfig } from './config/app.config';
import { MetricsService } from './infrastructure/metrics/metrics.service';
import { WorkerModule } from './worker.module';

/**
 * Exporter mínimo de métricas del worker (no tiene servidor HTTP), solo en la
 * red interna.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(AppConfig);
  const logger = app.get(Logger);
  logger.log('Worker de anclaje iniciado (barrido cada 30 s, concurrencia 1)');

  const metrics = app.get(MetricsService);
  const servidor = createServer((peticion, respuesta) => {
    if (peticion.method !== 'GET' || !peticion.url?.startsWith('/metrics')) {
      respuesta.writeHead(404).end('not found');
      return;
    }
    metrics
      .metricas()
      .then((cuerpo) => {
        respuesta.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
        respuesta.end(cuerpo);
      })
      .catch(() => {
        respuesta.writeHead(500).end('error collecting metrics');
      });
  });

  const puertoMetricas = config.workerMetricsPort;
  await new Promise<void>((resolver) => servidor.listen(puertoMetricas, '0.0.0.0', resolver));
  logger.log(`Métricas del worker en http://0.0.0.0:${puertoMetricas}/metrics`);

  const apagar = async (senal: string): Promise<void> => {
    logger.log(`Señal ${senal} recibida: cerrando worker`);
    await new Promise<void>((resolver) => servidor.close(() => resolver()));
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void apagar('SIGTERM'));
  process.on('SIGINT', () => void apagar('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('No fue posible iniciar el worker:', error);
  process.exit(1);
});
