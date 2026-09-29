import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { AppConfig } from './config/app.config';
import { AppConfigModule } from './config/config.module';
import { BlockchainModule } from './infrastructure/blockchain/blockchain.module';
import { ClockModule } from './infrastructure/clock/clock.module';
import { HealthModule } from './infrastructure/health/health.module';
import { MetricsInterceptor } from './infrastructure/metrics/metrics.interceptor';
import { MetricsModule } from './infrastructure/metrics/metrics.module';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AseguradorasModule } from './modules/aseguradoras/aseguradoras.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { PolizasModule } from './modules/polizas/polizas.module';
import { RecibosModule } from './modules/recibos/recibos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

/** Acepta un `x-request-id` entrante solo si es un UUID válido. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Logger de pino: JSON en todos los entornos, con `requestId` por solicitud.
 * `LOG_PRETTY=true` (solo desarrollo, ver `pnpm dev:pretty`) habilita la salida
 * legible; en producción nunca se activa y las cabeceras sensibles se redactan.
 */
export function opcionesLogger() {
  return LoggerModule.forRootAsync({
    imports: [AppConfigModule],
    inject: [AppConfig],
    useFactory: (config: AppConfig) => ({
      pinoHttp: {
        level: config.logLevel,
        genReqId: (req, res) => {
          const existente = req.headers['x-request-id'];
          const id =
            typeof existente === 'string' && UUID_RE.test(existente) ? existente : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
          censor: '[REDACTADO]',
        },
        transport: config.logPretty
          ? {
              target: 'pino-pretty',
              options: { singleLine: true, colorize: true, translateTime: 'SYS:HH:MM:ss' },
            }
          : undefined,
      },
    }),
  });
}

@Module({
  imports: [
    AppConfigModule,
    opcionesLogger(),
    // Límite global por IP y minuto. Configurable para que la medición de carga
    // no mida el limitador en lugar del API (ver .env.example). Se resuelve
    // con forRootAsync porque el decorador se evalúa antes de que exista DI.
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: config.throttle.global }],
      }),
    }),
    ClockModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    BlockchainModule,
    MetricsModule.forRoot('oasis-api'),
    HealthModule,
    AuthModule,
    UsuariosModule,
    ClientesModule,
    AseguradorasModule,
    PolizasModule,
    PagosModule,
    RecibosModule,
  ],
  providers: [
    // El orden importa: los guards globales se ejecutan en el orden declarado.
    // Throttler va primero para que el rate limit también aplique a las
    // peticiones no autenticadas (login, verificación pública); si fuera último,
    // JwtAuthGuard respondería 401 antes de que el throttler llegue a contar.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
