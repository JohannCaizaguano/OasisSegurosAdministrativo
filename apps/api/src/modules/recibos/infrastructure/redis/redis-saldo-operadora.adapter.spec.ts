import type Redis from 'ioredis';

import { RedisSaldoOperadoraAdapter } from './redis-saldo-operadora.adapter';

const GUARDADO = {
  wei: '400000000000000000',
  pol: '0.4',
  umbralPol: '0.5',
  bajoUmbral: true,
  actualizadoEn: '2026-10-24T15:00:00.000Z',
};

describe('RedisSaldoOperadoraAdapter (D17)', () => {
  it('guarda la llave operadora:saldo con TTL de 15 minutos', async () => {
    const redis = { set: jest.fn() };
    await new RedisSaldoOperadoraAdapter(redis as unknown as Redis).guardar(GUARDADO);

    expect(redis.set).toHaveBeenCalledWith('operadora:saldo', JSON.stringify(GUARDADO), 'EX', 900);
  });

  it('sin llave responde { disponible: false }', async () => {
    const redis = { get: jest.fn().mockResolvedValue(null) };
    await expect(new RedisSaldoOperadoraAdapter(redis as unknown as Redis).leer()).resolves.toEqual(
      {
        disponible: false,
      },
    );
  });

  it('con llave responde el saldo sin el valor en wei', async () => {
    const redis = { get: jest.fn().mockResolvedValue(JSON.stringify(GUARDADO)) };
    await expect(new RedisSaldoOperadoraAdapter(redis as unknown as Redis).leer()).resolves.toEqual(
      {
        disponible: true,
        pol: '0.4',
        umbralPol: '0.5',
        bajoUmbral: true,
        actualizadoEn: '2026-10-24T15:00:00.000Z',
      },
    );
  });

  it('una llave corrupta se trata como sin datos', async () => {
    const redis = { get: jest.fn().mockResolvedValue('{no-json') };
    await expect(new RedisSaldoOperadoraAdapter(redis as unknown as Redis).leer()).resolves.toEqual(
      {
        disponible: false,
      },
    );
  });
});
