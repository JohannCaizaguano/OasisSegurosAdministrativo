import type { EstadoPoliza } from '@oasis/shared';

import type { Poliza } from '../../domain/poliza';

export const POLIZAS_REPOSITORY = Symbol('PolizasRepositoryPort');

export interface FiltrosPolizas {
  clienteId?: string;
  estado?: EstadoPoliza;
  q?: string;
  pagina: number;
  porPagina: number;
}

export interface PaginaPolizas {
  items: Poliza[];
  total: number;
}

export interface DatosCrearPoliza {
  numero: string;
  clienteId: string;
  aseguradoraId: string;
  ramo: string;
  primaTotal: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPoliza;
}

export type DatosActualizarPoliza = Partial<Omit<DatosCrearPoliza, 'clienteId'>> & {
  clienteId?: string;
};

export interface PolizasRepositoryPort {
  crear(datos: DatosCrearPoliza): Promise<Poliza>;
  listar(filtros: FiltrosPolizas): Promise<PaginaPolizas>;
  buscarPorId(id: string): Promise<Poliza | null>;
  actualizar(id: string, datos: DatosActualizarPoliza): Promise<Poliza>;
  eliminar(id: string): Promise<void>;
  existeNumero(numero: string, exceptoId?: string): Promise<boolean>;
}
