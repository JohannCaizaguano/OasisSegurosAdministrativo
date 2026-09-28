import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AppConfig } from '../../config/app.config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        connection: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 1_000,
          removeOnFail: 5_000,
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
