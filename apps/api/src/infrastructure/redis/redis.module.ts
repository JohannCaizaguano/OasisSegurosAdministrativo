import { Global, Module, Provider } from '@nestjs/common';
import Redis from 'ioredis';

import { AppConfig } from '../../config/app.config';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

const proveedorRedis: Provider = {
  provide: REDIS_CLIENT,
  inject: [AppConfig],
  useFactory: (config: AppConfig): Redis => {
    const { host, port, password } = config.redis;
    return new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  },
};

@Global()
@Module({
  providers: [proveedorRedis],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
