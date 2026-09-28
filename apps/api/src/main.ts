import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(AppConfig);
  const logger = app.get(Logger);

  app.use(helmet());
  app.use(cookieParser());

  // Mismo origen en producción (Caddy hace de reverse proxy): CORS solo en dev.
  if (!config.esProduccion) {
    app.enableCors({ origin: true, credentials: true });
  }

  app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
  app.enableShutdownHooks();

  if (!config.esProduccion) {
    const documento = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Oasis Seguros API')
        .setDescription('API del bróker de seguros con anclaje de recibos en Polygon PoS (Amoy)')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('api/docs', app, documento);
    logger.log('Swagger disponible en /api/docs');
  }

  await app.listen(config.puerto);
  logger.log(`API escuchando en el puerto ${config.puerto} (${config.nodeEnv})`);
}

bootstrap().catch((error) => {
  console.error('No fue posible iniciar el API:', error);
  process.exit(1);
});
