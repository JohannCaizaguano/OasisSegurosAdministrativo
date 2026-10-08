import type { EstadoPoliza, OrdenPoliza } from '@oasis/shared';

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
}

/** D11: el cliente no se mueve; `estado` cambia por su propio caso de uso. */
export type DatosActualizarPoliza = Partial<Omit<DatosCrearPoliza, 'clienteId'>>;

/** Proyección del catálogo de ramos que usa el módulo. */
export interface RamoResumen {
  id: string;
  codigo: string;
  nombre: string;
}

export interface PolizasRepositoryPort {
  crear(datos: DatosCrearPoliza): Promise<Poliza>;
  listar(filtros: FiltrosPolizas): Promise<PaginaPolizas>;
  buscarPorId(id: string): Promise<Poliza | null>;
  actualizar(id: string, datos: DatosActualizarPoliza): Promise<Poliza>;
  cambiarEstado(id: string, estado: EstadoPoliza): Promise<Poliza>;
  existeNumero(numero: string, exceptoId?: string): Promise<boolean>;
  buscarClienteParaPoliza(id: string): Promise<{ activo: boolean } | null>;
  existeAseguradora(id: string): Promise<boolean>;
  buscarRamoActivoPorId(id: string): Promise<RamoResumen | null>;
  listarRamosActivos(): Promise<RamoResumen[]>;
}
