import { fechaEnGuayaquil } from '@oasis/shared';

import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { PolizasRepositoryPort } from '../ports/polizas.repository.port';

export interface ResultadoVencimiento {
  actualizadas: number;
  duracionMs: number;
}

/**
 * HU-37 (RN-14, D14): idempotente y se pone al día sola si el worker estuvo apagado, porque
 * marca todo lo vencido antes de hoy, no solo lo de ayer.
 */
export class MarcarCuotasVencidasUseCase {
  constructor(
    private readonly polizas: PolizasRepositoryPort,
    private readonly clock: ClockPort,
  ) {}

  async ejecutar(): Promise<ResultadoVencimiento> {
    const inicio = this.clock.ahora();
    const actualizadas = await this.polizas.marcarCuotasVencidas(fechaEnGuayaquil(inicio));
    return { actualizadas, duracionMs: this.clock.ahora().getTime() - inicio.getTime() };
  }
}
