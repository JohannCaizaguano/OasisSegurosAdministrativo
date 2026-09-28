import type { Aseguradora } from '../../domain/aseguradora';

export const ASEGURADORAS_REPOSITORY = Symbol('AseguradorasRepositoryPort');

export interface FiltrosAseguradoras {
  q?: string;
  pagina: number;
  porPagina: number;
}

export interface PaginaAseguradoras {
  items: Aseguradora[];
  total: number;
}

export interface DatosCrearAseguradora {
  nombre: string;
  ruc: string;
}

export type DatosActualizarAseguradora = Partial<DatosCrearAseguradora>;

export interface AseguradorasRepositoryPort {
  crear(datos: DatosCrearAseguradora): Promise<Aseguradora>;
  listar(filtros: FiltrosAseguradoras): Promise<PaginaAseguradoras>;
  buscarPorId(id: string): Promise<Aseguradora | null>;
  actualizar(id: string, datos: DatosActualizarAseguradora): Promise<Aseguradora>;
  eliminar(id: string): Promise<void>;
  existeRuc(ruc: string, exceptoId?: string): Promise<boolean>;
}
