import type { Rol } from '@oasis/shared';

import type { Usuario } from '../../domain/usuario';

export const USUARIOS_REPOSITORY = Symbol('UsuariosRepositoryPort');

export interface FiltrosUsuarios {
  rol?: Rol;
  pagina: number;
  porPagina: number;
}

export interface PaginaUsuarios {
  items: Usuario[];
  total: number;
}

export interface UsuariosRepositoryPort {
  listar(filtros: FiltrosUsuarios): Promise<PaginaUsuarios>;
}
