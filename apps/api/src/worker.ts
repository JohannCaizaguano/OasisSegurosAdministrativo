import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const logger = app.get(Logger);
  logger.log('Worker de anclaje iniciado (barrido cada 30 s, concurrencia 1)');

  const apagar = async (senal: string): Promise<void> => {
    logger.log(`Señal ${senal} recibida: cerrando worker`);
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
