import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { opcionesLogger } from './app.module';
import { AppConfigModule } from './config/config.module';
import { BlockchainModule } from './infrastructure/blockchain/blockchain.module';
import { CuentaOperadoraModule } from './infrastructure/blockchain/cuenta-operadora.module';
import { ClockModule } from './infrastructure/clock/clock.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AnclajeProcessor } from './modules/recibos/infrastructure/queue/anclaje.processor';
import { BarridoPendientesTask } from './modules/recibos/infrastructure/queue/barrido-pendientes.task';
import { RecibosModule } from './modules/recibos/recibos.module';
import { POLIZAS_REPOSITORY } from './modules/polizas/application/ports/polizas.repository.port';
import { MarcarCuotasVencidasUseCase } from './modules/polizas/application/use-cases/marcar-cuotas-vencidas.use-case';
import { PrismaPolizasRepository } from './modules/polizas/infrastructure/persistence/prisma-polizas.repository';
import { VencimientoCuotasTask } from './modules/polizas/infrastructure/schedule/vencimiento-cuotas.task';
import { TOKENS_TRANSVERSALES } from './shared-kernel/tokens';
import { umbralSaldoOperadoraDelEntorno } from './config/env.schema';
import {
  SaldoOperadoraTask,
  UMBRAL_SALDO_OPERADORA,
} from './modules/recibos/infrastructure/blockchain/saldo-operadora.task';
import type { ClockPort } from './shared-kernel/clock.port';

/**
 * Módulo del worker: sin HTTP, con la cola BullMQ, las tareas programadas (barrido de
 * pendientes, vencimiento de cuotas y saldo de la operadora) y la cuenta operadora (firma custodial).
 */
@Module({
  imports: [
    AppConfigModule,
    opcionesLogger(),
    ScheduleModule.forRoot(),
    ClockModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    BlockchainModule,
    CuentaOperadoraModule,
    MetricsModule.forRoot('oasis-worker'),
    RecibosModule,
  ],
  providers: [
    AnclajeProcessor,
    BarridoPendientesTask,
    // Solo el caso de uso del vencimiento: el worker no expone los controladores de pólizas.
    { provide: POLIZAS_REPOSITORY, useClass: PrismaPolizasRepository },
    {
      provide: MarcarCuotasVencidasUseCase,
      inject: [POLIZAS_REPOSITORY, TOKENS_TRANSVERSALES.CLOCK],
      useFactory: (repo: PrismaPolizasRepository, clock: ClockPort) =>
        new MarcarCuotasVencidasUseCase(repo, clock),
    },
    VencimientoCuotasTask,
    { provide: UMBRAL_SALDO_OPERADORA, useFactory: () => umbralSaldoOperadoraDelEntorno() },
    SaldoOperadoraTask,
  ],
})
export class WorkerModule {}
