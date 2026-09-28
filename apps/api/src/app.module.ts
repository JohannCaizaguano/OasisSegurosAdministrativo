import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
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

export function opcionesLogger() {
  return LoggerModule.forRoot({
    pinoHttp: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      genReqId: (req, res) => {
        const existente = req.headers['x-request-id'];
        const id = typeof existente === 'string' && existente.length > 0 ? existente : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '[REDACTADO]',
      },
      transport:
        process.env.NODE_ENV === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: { singleLine: true, colorize: true, translateTime: 'SYS:HH:MM:ss' },
            },
    },
  });
}

@Module({
  imports: [
    AppConfigModule,
    opcionesLogger(),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
    }),
    ClockModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    BlockchainModule,
    MetricsModule,
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
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
