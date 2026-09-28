import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type Redis from 'ioredis';

import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly indicador: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  async isHealthy(key: string) {
    const check = this.indicador.check(key);
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return check.up();
    } catch (error) {
      return check.down({ message: (error as Error).message });
    }
  }
}

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly indicador: HealthIndicatorService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async isHealthy(key: string) {
    const check = this.indicador.check(key);
    try {
      const respuesta = await this.redis.ping();
      return respuesta === 'PONG' ? check.up() : check.down({ message: `Respuesta: ${respuesta}` });
    } catch (error) {
      return check.down({ message: (error as Error).message });
    }
  }
}
