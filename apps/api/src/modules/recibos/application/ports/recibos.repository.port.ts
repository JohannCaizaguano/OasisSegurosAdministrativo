import type { EstadoRecibo } from '@oasis/shared';

import type { Recibo } from '../../domain/recibo';

export const RECIBOS_REPOSITORY = Symbol('RecibosRepositoryPort');

export interface FiltrosRecibos {
  estado?: EstadoRecibo;
  pagina: number;
  porPagina: number;
}

export interface PaginaRecibos {
  items: Recibo[];
  total: number;
}

export interface RecibosRepositoryPort {
  buscarPorId(id: string): Promise<Recibo | null>;
  buscarPorCodigo(codigo: string): Promise<Recibo | null>;
  listar(filtros: FiltrosRecibos): Promise<PaginaRecibos>;
  guardar(recibo: Recibo): Promise<Recibo>;
  /**
   * Recibos del outbox sin resolver antes de la fecha de corte: los
   * PENDIENTE_ANCLAJE por `creadoEn` y los ENVIADO por `enviadoEn`.
   */
  listarPendientes(antesDe: Date): Promise<Recibo[]>;
  contarPendientes(): Promise<number>;
}
