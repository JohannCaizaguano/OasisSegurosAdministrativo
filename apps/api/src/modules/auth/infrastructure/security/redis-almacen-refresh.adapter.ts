import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import { AppConfig } from '../../../../config/app.config';
import { duracionASegundos } from '../../../../shared-kernel/duracion';
import { REDIS_CLIENT } from '../../../../infrastructure/redis/redis.module';
import type { AlmacenRefreshPort } from '../../application/ports/almacen-refresh.port';

const PREFIJO = 'refresh:';

/**
 * Un único jti vigente por usuario: guardar uno nuevo invalida el anterior
 * (rotación). La reutilización de un jti consumido se detecta en el caso de uso.
 */
@Injectable()
export class RedisAlmacenRefreshAdapter implements AlmacenRefreshPort {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: AppConfig,
  ) {}

  async guardar(usuarioId: string, jti: string): Promise<void> {
    await this.redis.set(this.clave(usuarioId), jti, 'EX', this.ttlSegundos());
  }

  async consumir(usuarioId: string, jti: string): Promise<boolean> {
    const actual = await this.redis.get(this.clave(usuarioId));
    if (actual !== jti) {
      return false;
    }
    await this.redis.del(this.clave(usuarioId));
    return true;
  }

  async revocar(usuarioId: string, jti: string): Promise<void> {
    const actual = await this.redis.get(this.clave(usuarioId));
    if (actual === jti) {
      await this.redis.del(this.clave(usuarioId));
    }
  }

  async revocarTodos(usuarioId: string): Promise<void> {
    await this.redis.del(this.clave(usuarioId));
  }

  private clave(usuarioId: string): string {
    return `${PREFIJO}${usuarioId}`;
  }

  private ttlSegundos(): number {
    return duracionASegundos(this.config.auth.refreshTtl);
  }
}
