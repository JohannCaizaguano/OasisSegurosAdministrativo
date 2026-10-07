import type { Rol } from '@oasis/shared';

import { Entity } from '../../../shared-kernel/entity';

export interface PropsUsuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  clienteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export class Usuario extends Entity<PropsUsuario> {
  private constructor(props: PropsUsuario) {
    super(props);
  }

  static reconstituir(props: PropsUsuario): Usuario {
    return new Usuario(props);
  }

  get email(): string {
    return this.props.email;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get rol(): Rol {
    return this.props.rol;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  get clienteId(): string | null {
    return this.props.clienteId;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get updatedAt(): string {
    return this.props.updatedAt;
  }
}
