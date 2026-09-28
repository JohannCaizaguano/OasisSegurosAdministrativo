import { NestFactory } from '@nestjs/core';
import { createServer } from 'node:http';
import { Logger } from 'nestjs-pino';

import { MetricsService } from './infrastructure/metrics/metrics.service';
import { WorkerModule } from './worker.module';

/**
 * El worker se levanta con `createApplicationContext`: no hay servidor HTTP, de
 * modo que las métricas que emite (anclajes, latencia, backlog del outbox)
 * nunca llegaban a Prometheus y los paneles del dashboard quedaban vacíos.
 * Se exponen con un servidor mínimo, solo en la red interna.
 */
const PUERTO_METRICAS = Number(process.env['WORKER_METRICS_PORT'] ?? 9101);

async function bootstrap(): Promise<void> {
  // Distingue las series del worker de las del API en Prometheus.
  process.env['METRICS_APP'] = 'oasis-worker';

  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

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

  await new Promise<void>((resolver) => servidor.listen(PUERTO_METRICAS, '0.0.0.0', resolver));
  logger.log(`Métricas del worker en http://0.0.0.0:${PUERTO_METRICAS}/metrics`);

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
