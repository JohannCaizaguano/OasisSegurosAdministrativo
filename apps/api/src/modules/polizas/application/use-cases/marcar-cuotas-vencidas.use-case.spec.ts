import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { PolizasRepositoryPort } from '../ports/polizas.repository.port';
import { MarcarCuotasVencidasUseCase } from './marcar-cuotas-vencidas.use-case';

describe('MarcarCuotasVencidasUseCase (HU-37, RN-14, D14)', () => {
  // 05:10 UTC = 00:10 en Guayaquil del 24/10.
  const clock: ClockPort = { ahora: () => new Date('2026-10-24T05:10:00.000Z') };

  it('marca con la fecha de Guayaquil (no la de UTC) y devuelve cuántas actualizó', async () => {
    const repo = { marcarCuotasVencidas: jest.fn().mockResolvedValue(3) };
    const caso = new MarcarCuotasVencidasUseCase(repo as unknown as PolizasRepositoryPort, clock);

    const resultado = await caso.ejecutar();

    expect(repo.marcarCuotasVencidas).toHaveBeenCalledWith('2026-10-24');
    expect(resultado.actualizadas).toBe(3);
    expect(resultado.duracionMs).toBeGreaterThanOrEqual(0);
  });

  it('antes de la medianoche de Guayaquil aún usa el día anterior', async () => {
    const repo = { marcarCuotasVencidas: jest.fn().mockResolvedValue(0) };
    const tarde: ClockPort = { ahora: () => new Date('2026-10-24T04:59:00.000Z') };

    await new MarcarCuotasVencidasUseCase(
      repo as unknown as PolizasRepositoryPort,
      tarde,
    ).ejecutar();

    expect(repo.marcarCuotasVencidas).toHaveBeenCalledWith('2026-10-23');
  });
});
