import { parseEther } from 'viem';

import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { SaldoOperadoraPort } from '../../application/ports/saldo-operadora.port';
import { SaldoOperadoraTask } from './saldo-operadora.task';

const DIRECCION = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

function crear(getBalance: jest.Mock, umbralPol = '0.5') {
  const saldos = { guardar: jest.fn(), leer: jest.fn() };
  const logger = { setContext: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const gauge = { set: jest.fn() };
  const clock: ClockPort = { ahora: () => new Date('2026-10-24T15:00:00.000Z') };
  const tarea = new SaldoOperadoraTask(
    { getBalance } as never,
    { account: { address: DIRECCION } } as never,
    saldos as unknown as SaldoOperadoraPort,
    { operadoraSaldoPol: gauge } as never,
    clock,
    logger as never,
    umbralPol,
  );
  return { tarea, saldos, logger, gauge };
}

describe('SaldoOperadoraTask (HU-42, D17)', () => {
  it('bajo el umbral guarda bajoUmbral: true, publica la métrica y registra un warn', async () => {
    const getBalance = jest.fn().mockResolvedValue(parseEther('0.4'));
    const { tarea, saldos, logger, gauge } = crear(getBalance);

    await tarea.actualizar();

    expect(getBalance).toHaveBeenCalledWith({ address: DIRECCION });
    expect(saldos.guardar).toHaveBeenCalledWith({
      wei: '400000000000000000',
      pol: '0.4',
      umbralPol: '0.5',
      bajoUmbral: true,
      actualizadoEn: '2026-10-24T15:00:00.000Z',
    });
    expect(gauge.set).toHaveBeenCalledWith(0.4);
    expect(logger.warn).toHaveBeenCalledWith(
      { evento: 'saldo-operadora-bajo', pol: '0.4', umbralPol: '0.5' },
      expect.any(String),
    );
  });

  it('sobre el umbral guarda bajoUmbral: false y no registra warn', async () => {
    const { tarea, saldos, logger } = crear(jest.fn().mockResolvedValue(parseEther('0.6')));

    await tarea.actualizar();

    expect(saldos.guardar).toHaveBeenCalledWith(
      expect.objectContaining({ pol: '0.6', bajoUmbral: false }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('el umbral es configurable: con 1000 POL, 0.6 queda por debajo', async () => {
    const { tarea, saldos } = crear(jest.fn().mockResolvedValue(parseEther('0.6')), '1000');

    await tarea.actualizar();

    expect(saldos.guardar).toHaveBeenCalledWith(expect.objectContaining({ bajoUmbral: true }));
  });

  it('con el RPC caído no escribe, registra un warn y no lanza (conserva el último valor)', async () => {
    const { tarea, saldos, logger } = crear(jest.fn().mockRejectedValue(new Error('RPC caído')));

    await expect(tarea.actualizar()).resolves.toBeUndefined();
    expect(saldos.guardar).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ evento: 'saldo-operadora-sin-lectura' }),
      expect.any(String),
    );
  });
});
