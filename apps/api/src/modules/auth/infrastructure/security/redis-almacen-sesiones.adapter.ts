import { Inject, Injectable } from '@nestjs/common';
import { TTL_SESION_SEGUNDOS } from '@oasis/shared';
import type Redis from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

import { REDIS_CLIENT } from '../../../../infrastructure/redis/redis.module';
import { ErrorDependenciaExterna } from '../../../../shared-kernel/domain-error';
import { conTiempoLimite } from '../../../../shared-kernel/tiempo-limite';
import type {
  AlmacenSesionesPort,
  ResultadoRotacion,
} from '../../application/ports/almacen-sesiones.port';

const PREFIJO = 'sesion:';

/** 1 rotó, 0 la sesión no existe, -1 el `jti` no es el vigente y la sesión se borra. Atómico. */
const ROTAR = `
local vigente = redis.call('GET', KEYS[1])
if not vigente then
  return 0
end
if vigente ~= ARGV[1] then
  redis.call('DEL', KEYS[1])
  return -1
end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1
`;

@Injectable()
export class RedisAlmacenSesionesAdapter implements AlmacenSesionesPort {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisAlmacenSesionesAdapter.name);
  }

  async abrir(usuarioId: string, sid: string, jti: string): Promise<void> {
    await this.conFalloCerrado(
      this.redis.set(this.clave(usuarioId, sid), jti, 'EX', TTL_SESION_SEGUNDOS),
    );
  }

  async rotar(
    usuarioId: string,
    sid: string,
    jtiPresentado: string,
    jtiNuevo: string,
  ): Promise<ResultadoRotacion> {
    const resultado = await this.conFalloCerrado(
      this.redis.eval(
        ROTAR,
        1,
        this.clave(usuarioId, sid),
        jtiPresentado,
        jtiNuevo,
        String(TTL_SESION_SEGUNDOS),
      ),
    );
    if (resultado === 1) {
      return 'ROTADA';
    }
    return resultado === 0 ? 'EXPIRADA' : 'REUTILIZADA';
  }

  async tocar(usuarioId: string, sid: string): Promise<boolean> {
    const existe = await this.conFalloCerrado(
      this.redis.expire(this.clave(usuarioId, sid), TTL_SESION_SEGUNDOS),
    );
    return existe === 1;
  }

  async cerrar(usuarioId: string, sid: string): Promise<void> {
    await this.conFalloCerrado(this.redis.del(this.clave(usuarioId, sid)));
  }

  async cerrarDemas(usuarioId: string, sidVigente: string): Promise<void> {
    await this.conFalloCerrado(this.barrerDemas(usuarioId, sidVigente));
  }

  private async barrerDemas(usuarioId: string, sidVigente: string): Promise<void> {
    const vigente = this.clave(usuarioId, sidVigente);
    const flujo = this.redis.scanStream({ match: `${PREFIJO}${usuarioId}:*`, count: 100 });
    for await (const llaves of flujo) {
      const otras = (llaves as string[]).filter((llave) => llave !== vigente);
      if (otras.length > 0) {
        await this.redis.del(...otras);
      }
    }
  }

  /** Falla cerrada: sin Redis no se puede operar con sesiones (D9). */
  private async conFalloCerrado<T>(operacion: Promise<T>): Promise<T> {
    try {
      return await conTiempoLimite(operacion, 'Redis');
    } catch (error: unknown) {
      // El 502 no dice si fue un tiempo límite, la conexión o el script: el log sí.
      this.logger.error({ err: error }, 'Fallo de Redis en el almacén de sesiones');
      throw new ErrorDependenciaExterna('No se pudo completar la operación con las sesiones');
    }
  }

  private clave(usuarioId: string, sid: string): string {
    return `${PREFIJO}${usuarioId}:${sid}`;
  }
}
