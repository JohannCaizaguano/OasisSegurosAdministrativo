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
  /** Recibos en PENDIENTE_ANCLAJE creados antes de la fecha de corte. */
  listarPendientes(creadosAntesDe: Date): Promise<Recibo[]>;
  contarPendientes(): Promise<number>;
}
