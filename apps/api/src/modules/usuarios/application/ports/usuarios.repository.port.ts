import type { RolPersonal } from '@oasis/shared';

import type { Usuario } from '../../domain/usuario';

export const USUARIOS_REPOSITORY = Symbol('UsuariosRepositoryPort');

export interface FiltrosUsuarios {
  pagina: number;
  porPagina: number;
}

export interface PaginaUsuarios {
  items: Usuario[];
  total: number;
}

export interface DatosCrearUsuario {
  email: string;
  nombre: string;
  rol: RolPersonal;
  passwordHash: string;
}

export interface DatosActualizarUsuario {
  nombre?: string;
  rol?: RolPersonal;
}

export interface UsuariosRepositoryPort {
  listar(filtros: FiltrosUsuarios): Promise<PaginaUsuarios>;
  crear(datos: DatosCrearUsuario): Promise<Usuario>;
  /** Solo cuentas del personal: una CLIENTE devuelve null (D7). */
  buscarPorId(id: string): Promise<Usuario | null>;
  existeCorreo(email: string): Promise<boolean>;
  actualizar(id: string, datos: DatosActualizarUsuario): Promise<Usuario>;
  cambiarActivo(id: string, activo: boolean): Promise<Usuario>;
  cambiarHash(id: string, passwordHash: string): Promise<Usuario>;
  /**
   * Cambia el rol y/o el estado en una transacción que impide dejar el sistema sin ADMIN activo
   * (D9); devuelve `ultimo-admin` sin escribir cuando la operación lo dejaría sin administrador.
   */
  actualizarSiNoEsUltimoAdmin(
    id: string,
    datos: DatosActualizarUsuario & { activo?: boolean },
  ): Promise<'ok' | 'ultimo-admin'>;
}
