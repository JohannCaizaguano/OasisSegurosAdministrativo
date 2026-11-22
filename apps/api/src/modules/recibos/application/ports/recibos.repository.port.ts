import type { EstadoRecibo, MetodoPago } from '@oasis/shared';

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

/** Proyección del recibo imprimible (D7), leída con un solo `include`. */
export interface DatosReciboImprimible {
  codigo: string;
  estado: EstadoRecibo;
  creadoEn: string;
  ancladoEn: string | null;
  txHash: string | null;
  pago: { monto: string; fechaPago: string; metodo: MetodoPago; referencia: string | null };
  poliza: { numero: string; ramo: string; aseguradora: string; clienteId: string };
  cliente: { nombre: string; identificacion: string };
}

export interface RecibosRepositoryPort {
  buscarPorId(id: string): Promise<Recibo | null>;
  /** Incluye el `clienteId` de la póliza para filtrar al CLIENTE (RN-07). */
  buscarPorCodigo(codigo: string): Promise<Recibo | null>;
  listar(filtros: FiltrosRecibos): Promise<PaginaRecibos>;
  buscarImprimible(id: string): Promise<DatosReciboImprimible | null>;
  guardar(recibo: Recibo): Promise<Recibo>;
  /**
   * Recibos del outbox sin resolver antes de la fecha de corte: los
   * PENDIENTE_ANCLAJE por `creadoEn` y los ENVIADO por `enviadoEn`.
   */
  listarPendientes(antesDe: Date): Promise<Recibo[]>;
  contarPendientes(): Promise<number>;
}
