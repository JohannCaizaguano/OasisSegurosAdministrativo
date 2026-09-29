import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import { AppConfig } from '../../../../config/app.config';
import { duracionASegundos } from '../../../../shared-kernel/duracion';
import { REDIS_CLIENT } from '../../../../infrastructure/redis/redis.module';
import type { AlmacenRefreshPort } from '../../application/ports/almacen-refresh.port';

const PREFIJO = 'refresh:';

/**
 * Devuelve 1 y borra la clave si su valor es el jti esperado; si no, no toca
 * nada. Atómico: elimina la ventana entre leer y borrar.
 */
const CONSUMIR_SI_COINCIDE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('DEL', KEYS[1])
  return 1
end
return 0
`;

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

  /**
   * Consume el jti solo si es el vigente, en una operación atómica: con `GET` +
   * `DEL` dos peticiones concurrentes con el mismo token pasaban ambas la
   * validación.
   */
  async consumir(usuarioId: string, jti: string): Promise<boolean> {
    const resultado = await this.redis.eval(CONSUMIR_SI_COINCIDE, 1, this.clave(usuarioId), jti);
    return resultado === 1;
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
