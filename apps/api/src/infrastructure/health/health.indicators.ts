import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type Redis from 'ioredis';

import { conTiempoLimite } from '../../shared-kernel/tiempo-limite';
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
      await conTiempoLimite(this.prisma.$queryRaw`SELECT 1`, 'PostgreSQL');
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
      // ioredis tipa `ping()` como `Promise<'PONG'>`; en la práctica devuelve
      // cualquier respuesta del servidor, así que se ensancha a string.
      const respuesta = await conTiempoLimite(this.redis.ping() as Promise<string>, 'Redis');
      return respuesta === 'PONG' ? check.up() : check.down({ message: `Respuesta: ${respuesta}` });
    } catch (error) {
      return check.down({ message: (error as Error).message });
    }
  }
}
