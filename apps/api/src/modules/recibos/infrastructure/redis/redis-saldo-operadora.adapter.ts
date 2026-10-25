import type { SaldoOperadora } from '@oasis/shared';
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from '../../../../infrastructure/redis/redis.module';
import type {
  LecturaSaldoOperadora,
  SaldoOperadoraPort,
} from '../../application/ports/saldo-operadora.port';

const LLAVE = 'operadora:saldo';
// Tres lecturas perdidas seguidas (cada 5 min) dejan el panel sin datos en vez de mostrar uno viejo.
const TTL_SEGUNDOS = 900;

@Injectable()
export class RedisSaldoOperadoraAdapter implements SaldoOperadoraPort {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async guardar(lectura: LecturaSaldoOperadora): Promise<void> {
    await this.redis.set(LLAVE, JSON.stringify(lectura), 'EX', TTL_SEGUNDOS);
  }

  async leer(): Promise<SaldoOperadora> {
    const guardado = await this.redis.get(LLAVE);
    if (!guardado) return { disponible: false };
    try {
      const { pol, umbralPol, bajoUmbral, actualizadoEn } = JSON.parse(
        guardado,
      ) as LecturaSaldoOperadora;
      return { disponible: true, pol, umbralPol, bajoUmbral, actualizadoEn };
    } catch {
      return { disponible: false };
    }
  }
}
