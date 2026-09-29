import type { EstadoPago, MetodoPago } from '@oasis/shared';

import type { DatosNuevoRecibo, Recibo } from '../../../recibos/domain/recibo';
import type { Pago } from '../../domain/pago';

export const PAGOS_REPOSITORY = Symbol('PagosRepositoryPort');

export interface FiltrosPagos {
  estado?: EstadoPago;
  polizaId?: string;
  clienteId?: string;
  desde?: string;
  hasta?: string;
  q?: string;
  pagina: number;
  porPagina: number;
}

export interface PaginaPagos {
  items: Pago[];
  total: number;
}

export interface DatosCrearPago {
  polizaId: string;
  monto: string;
  fechaPago: string;
  metodoPagoId: string;
  registradoPorId: string | null;
  referencia?: string;
}

/** Entrada de aplicación: el método llega como código del catálogo. */
export interface ComandoCrearPago extends Omit<DatosCrearPago, 'metodoPagoId'> {
  metodo: MetodoPago;
}

/** Proyección mínima del catálogo de métodos de pago que usa el módulo. */
export interface MetodoPagoResumen {
  id: string;
  codigo: MetodoPago;
}

export interface DatosValidarPago {
  pagoId: string;
  validadoPorId: string;
  validadoEn: Date;
  /** Nota de auditoría del operador; interna, no se ancla. */
  nota?: string | null;
  recibo: DatosNuevoRecibo;
}

export interface ResultadoValidacion {
  pago: Pago;
  recibo: Recibo;
}

export interface PagosRepositoryPort {
  crear(datos: DatosCrearPago): Promise<Pago>;
  listar(filtros: FiltrosPagos): Promise<PaginaPagos>;
  buscarPorId(id: string): Promise<Pago | null>;
  /** En UNA transacción: pago = VALIDADO y creación del Recibo PENDIENTE_ANCLAJE. */
  validarYCrearRecibo(datos: DatosValidarPago): Promise<ResultadoValidacion>;
  rechazar(id: string, rechazadoPorId: string, cuando: Date, motivo: string): Promise<Pago>;
  /** Resuelve un método de pago activo por su código (catálogo `MetodoPago`). */
  buscarMetodoPago(codigo: MetodoPago): Promise<MetodoPagoResumen | null>;
}
