import type Redis from 'ioredis';
import type { PinoLogger } from 'nestjs-pino';

import { RedisAlmacenSesionesAdapter } from './redis-almacen-sesiones.adapter';

/**
 * Redis caído con `maxRetriesPerRequest: null`: todo comando queda encolado sin
 * responder. Con los temporizadores falsos, `conTiempoLimite` debe cortar a los 2 s.
 */
function crearRedisColgado(): Redis {
  const nunca = () => new Promise<never>(() => undefined);
  return {
    set: nunca,
    eval: nunca,
    del: nunca,
    expire: nunca,
    scanStream: () => ({
      [Symbol.asyncIterator]: () => ({ next: nunca }),
    }),
  } as unknown as Redis;
}

describe('RedisAlmacenSesionesAdapter — fallo cerrado (D9)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** Debe rechazar con ErrorDependenciaExterna (502) en cuanto vencen los 2 s. */
  function fallaCerrado(operacion: Promise<unknown>): Promise<unknown> {
    const expectativa = expect(operacion).rejects.toMatchObject({
      codigo: 'DEPENDENCIA_EXTERNA',
    });
    jest.advanceTimersByTime(2_000);
    return expectativa;
  }

  const logger = { setContext: jest.fn(), error: jest.fn() };

  function adaptador() {
    return new RedisAlmacenSesionesAdapter(crearRedisColgado(), logger as unknown as PinoLogger);
  }

  it('abrir falla cerrado si Redis no responde', async () => {
    await fallaCerrado(adaptador().abrir('usuario-1', 'sid-1', 'jti-1'));
  });

  it('rotar falla cerrado si Redis no responde', async () => {
    await fallaCerrado(adaptador().rotar('usuario-1', 'sid-1', 'jti-1', 'jti-2'));
  });

  it('cerrar falla cerrado si Redis no responde', async () => {
    await fallaCerrado(adaptador().cerrar('usuario-1', 'sid-1'));
  });

  it('cerrarDemas falla cerrado si Redis no responde', async () => {
    await fallaCerrado(adaptador().cerrarDemas('usuario-1', 'sid-1'));
  });

  it('registra la causa del fallo, que el 502 no expone', async () => {
    logger.error.mockClear();
    await fallaCerrado(adaptador().tocar('usuario-1', 'sid-1'));
    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.objectContaining({ message: 'Redis no respondió en 2000 ms' }) },
      expect.any(String),
    );
  });
});

describe('RedisAlmacenSesionesAdapter — cerrarTodas (D8)', () => {
  const logger = { setContext: jest.fn(), error: jest.fn() };

  function crearRedisConSesiones(llaves: string[]) {
    const del = jest.fn().mockResolvedValue(llaves.length);
    const scanStream = jest.fn(() => ({
      [Symbol.asyncIterator]: () => {
        let pendiente = true;
        return {
          next: () => {
            if (pendiente) {
              pendiente = false;
              return Promise.resolve({ done: false as const, value: llaves });
            }
            return Promise.resolve({ done: true as const, value: undefined });
          },
        };
      },
    }));
    return { redis: { del, scanStream } as unknown as Redis, del, scanStream };
  }

  it('cierra todas las sesiones del usuario y no toca las de otros', async () => {
    const usuarioId = 'usuario-1';
    const llaves = [`sesion:${usuarioId}:sid-1`, `sesion:${usuarioId}:sid-2`];
    const { redis, del, scanStream } = crearRedisConSesiones(llaves);
    const adaptador = new RedisAlmacenSesionesAdapter(redis, logger as unknown as PinoLogger);

    await adaptador.cerrarTodas(usuarioId);

    expect(scanStream).toHaveBeenCalledWith({ match: `sesion:${usuarioId}:*`, count: 100 });
    expect(del).toHaveBeenCalledWith(...llaves);
  });

  it('no falla si el usuario no tiene sesiones', async () => {
    const { redis, del } = crearRedisConSesiones([]);
    const adaptador = new RedisAlmacenSesionesAdapter(redis, logger as unknown as PinoLogger);

    await expect(adaptador.cerrarTodas('usuario-1')).resolves.toBeUndefined();
    expect(del).not.toHaveBeenCalled();
  });

  it('cerrarTodas falla cerrado si Redis no responde', async () => {
    jest.useFakeTimers();
    try {
      const operacion = new RedisAlmacenSesionesAdapter(
        crearRedisColgado(),
        logger as unknown as PinoLogger,
      ).cerrarTodas('usuario-1');
      const expectativa = expect(operacion).rejects.toMatchObject({
        codigo: 'DEPENDENCIA_EXTERNA',
      });
      jest.advanceTimersByTime(2_000);
      await expectativa;
    } finally {
      jest.useRealTimers();
    }
  });
});
