import type { TipoIdentificacion } from '@oasis/shared';

import type { Cliente } from '../../domain/cliente';

export const CLIENTES_REPOSITORY = Symbol('ClientesRepositoryPort');

export interface FiltrosClientes {
  q?: string;
  tipoIdentificacion?: TipoIdentificacion;
  /** D8: `undefined` no filtra (estado TODOS). */
  activo?: boolean;
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

export type DatosActualizarCliente = Partial<DatosCrearCliente> & { activo?: boolean };

export interface ClientesRepositoryPort {
  crear(datos: DatosCrearCliente): Promise<Cliente>;
  listar(filtros: FiltrosClientes): Promise<PaginaClientes>;
  buscarPorId(id: string): Promise<Cliente | null>;
  actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente>;
  existeIdentificacion(identificacion: string, exceptoId?: string): Promise<boolean>;
}
