import type { TipoIdentificacion } from '@oasis/shared';

import type { Cliente } from '../../domain/cliente';

export const CLIENTES_REPOSITORY = Symbol('ClientesRepositoryPort');

export interface FiltrosClientes {
  q?: string;
  tipoIdentificacion?: TipoIdentificacion;
  pagina: number;
  porPagina: number;
}

export interface PaginaClientes {
  items: Cliente[];
  total: number;
}

export interface DatosCrearCliente {
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  nombres?: string;
  apellidos?: string;
  razonSocial?: string;
  email: string;
  telefono?: string;
}

export type DatosActualizarCliente = Partial<DatosCrearCliente>;

export interface ClientesRepositoryPort {
  crear(datos: DatosCrearCliente): Promise<Cliente>;
  listar(filtros: FiltrosClientes): Promise<PaginaClientes>;
  buscarPorId(id: string): Promise<Cliente | null>;
  actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente>;
  eliminar(id: string): Promise<void>;
  existeIdentificacion(identificacion: string, exceptoId?: string): Promise<boolean>;
}
