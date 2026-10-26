import type { Cuota, EstadoCuota, EstadoPoliza, OrdenPoliza } from '@oasis/shared';

import type { CuotaDelPlan } from '../../domain/plan-cuotas';

import type { Poliza } from '../../domain/poliza';

export const POLIZAS_REPOSITORY = Symbol('PolizasRepositoryPort');

export interface FiltrosPolizas {
  clienteId?: string;
  aseguradoraId?: string;
  estado?: EstadoPoliza;
  /** D15: la búsqueda es solo por número. */
  q?: string;
  orden: OrdenPoliza;
  pagina: number;
  porPagina: number;
}

export interface PaginaPolizas {
  items: Poliza[];
  total: number;
}

/** D9: sin `estado` (el repositorio siempre crea en VIGENTE) y con `ramoId` del catálogo. */
export interface DatosCrearPoliza {
  numero: string;
  clienteId: string;
  aseguradoraId: string;
  ramoId: string;
  primaTotal: string;
  fechaInicio: string;
  fechaFin: string;
  cobertura?: string;
  condiciones?: string;
}

/**
 * D11: el cliente no se mueve; `estado` cambia por su propio caso de uso. D17: `cobertura` o
 * `condiciones` en `null` borran el texto; ausentes no lo tocan.
 */
export type DatosActualizarPoliza = Partial<
  Omit<DatosCrearPoliza, 'clienteId' | 'cobertura' | 'condiciones'>
> & {
  cobertura?: string | null;
  condiciones?: string | null;
};

/** Proyección del catálogo de ramos que usa el módulo. */
export interface RamoResumen {
  id: string;
  codigo: string;
  nombre: string;
}

/** HU-38: límites inclusivos de `fechaVencimiento`, ya resueltos por el caso de uso. */
export interface FiltrosCartera {
  vencimientoDesde?: string;
  vencimientoHasta?: string;
  clienteId?: string;
  aseguradoraId?: string;
  pagina: number;
  porPagina: number;
}

export interface CuotaEnCartera {
  cuotaId: string;
  numero: number;
  valor: string;
  valorPagado: string;
  fechaVencimiento: string;
  estado: Exclude<EstadoCuota, 'PAGADA'>;
  poliza: { id: string; numero: string; ramo: string; ramoCodigo: string; aseguradora: string };
  cliente: { id: string; nombre: string };
}

export interface PolizasRepositoryPort {
  crear(datos: DatosCrearPoliza): Promise<Poliza>;
  listar(filtros: FiltrosPolizas): Promise<PaginaPolizas>;
  buscarPorId(id: string): Promise<Poliza | null>;
  /** Con `cuotas`, reemplaza el plan en la misma transacción (D13). */
  actualizar(id: string, datos: DatosActualizarPoliza, cuotas?: CuotaDelPlan[]): Promise<Poliza>;
  cambiarEstado(id: string, estado: EstadoPoliza): Promise<Poliza>;
  existeNumero(numero: string, exceptoId?: string): Promise<boolean>;
  buscarClienteParaPoliza(id: string): Promise<{ activo: boolean } | null>;
  existeAseguradora(id: string): Promise<boolean>;
  buscarRamoActivoPorId(id: string): Promise<RamoResumen | null>;
  listarRamosActivos(): Promise<RamoResumen[]>;
  listarCuotas(polizaId: string): Promise<Cuota[]>;
  /** D11: en una transacción, solo si sigue VIGENTE y sin pagos VALIDADOS. */
  reemplazarCuotas(polizaId: string, cuotas: CuotaDelPlan[]): Promise<Cuota[]>;
  /** D16: cuotas no PAGADAS por vencimiento ascendente, en una sola consulta. */
  listarCartera(filtros: FiltrosCartera): Promise<{ items: CuotaEnCartera[]; total: number }>;
  /** D14: marca VENCIDA toda cuota PENDIENTE o PARCIAL con vencimiento anterior a `hoy`. */
  marcarCuotasVencidas(hoy: string): Promise<number>;
}
