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

/**
 * Módulo del worker de anclaje: sin HTTP, con la cola BullMQ, el barrido
 * periódico y la cuenta operadora (firma custodial).
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
    MetricsModule,
    RecibosModule,
  ],
  providers: [AnclajeProcessor, BarridoPendientesTask],
})
export class WorkerModule {}
