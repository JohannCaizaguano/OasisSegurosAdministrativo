import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type Redis from 'ioredis';

import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';

/**
 * Tiempo máximo que un chequeo espera a su dependencia antes de reportarla
 * caída. Es imprescindible con Redis: BullMQ configura `ioredis` con
 * `maxRetriesPerRequest: null` (reintentos infinitos), así que un `ping` con el
 * servidor caído se queda encolado y `/health` nunca respondería 503.
 */
const TIEMPO_LIMITE_MS = 2_000;

function conTiempoLimite<T>(promesa: Promise<T>, descripcion: string): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const temporizador = setTimeout(
      () => rechazar(new Error(`${descripcion} no respondió en ${TIEMPO_LIMITE_MS} ms`)),
      TIEMPO_LIMITE_MS,
    );
    promesa
      .then((valor) => {
        clearTimeout(temporizador);
        resolver(valor);
      })
      .catch((error: unknown) => {
        clearTimeout(temporizador);
        rechazar(error instanceof Error ? error : new Error(String(error)));
      });
  });
}

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
