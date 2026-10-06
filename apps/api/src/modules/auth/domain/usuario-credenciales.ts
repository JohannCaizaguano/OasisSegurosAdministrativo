import type { Rol } from '@oasis/shared';

import { Entity } from '../../../shared-kernel/entity';

export interface PropsUsuarioCredenciales {
  id: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  activo: boolean;
  clienteId?: string | null;
  nombre: string;
}

/**
 * Vista de Usuario que necesita el módulo de autenticación. `nombre` es la
 * columna `Usuario.nombre`, que ya trae el nombre visible de cada cuenta.
 */
export class UsuarioCredenciales extends Entity<PropsUsuarioCredenciales> {
  private constructor(props: PropsUsuarioCredenciales) {
    super(props);
  }

  static reconstituir(props: PropsUsuarioCredenciales): UsuarioCredenciales {
    return new UsuarioCredenciales(props);
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get rol(): Rol {
    return this.props.rol;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  get clienteId(): string | null {
    return this.props.clienteId ?? null;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  puedeIniciarSesion(): boolean {
    return this.props.activo;
  }
}
