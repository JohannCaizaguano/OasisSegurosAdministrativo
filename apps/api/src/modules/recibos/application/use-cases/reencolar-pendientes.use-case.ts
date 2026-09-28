import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { ColaAnclajePort } from '../ports/cola-anclaje.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';

const ANTIGUEDAD_MINIMA_MS = 60_000;

export interface ResultadoBarrido {
  reencolados: number;
  pendientes: number;
}

/**
 * Barrido periódico del outbox: reencola los recibos que sigan en
 * PENDIENTE_ANCLAJE con más de 60 s de antigüedad. El jobId = reciboId evita
 * duplicados.
 */
export class ReencolarPendientesUseCase {
  constructor(
    private readonly recibos: RecibosRepositoryPort,
    private readonly cola: ColaAnclajePort,
    private readonly clock: ClockPort,
  ) {}

  async ejecutar(): Promise<ResultadoBarrido> {
    const corte = new Date(this.clock.ahora().getTime() - ANTIGUEDAD_MINIMA_MS);
    const pendientes = await this.recibos.listarPendientes(corte);

    for (const recibo of pendientes) {
      // Igual que en el reintento manual: sin retirar el job previo, un recibo
      // cuyo job ya terminó (por ejemplo el que devolvió ENVIADO tras agotar
      // la espera del receipt) nunca volvería a encolarse.
      await this.cola.desencolarAnclaje(recibo.id);
      await this.cola.encolarAnclaje(recibo.id);
    }

    return {
      reencolados: pendientes.length,
      pendientes: await this.recibos.contarPendientes(),
    };
  }
}
