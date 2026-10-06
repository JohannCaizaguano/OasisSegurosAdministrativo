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
