import type { TipoIdentificacion } from '@oasis/shared';

import { Entity } from '../../../shared-kernel/entity';

export interface PropsCliente {
  id: string;
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
  email: string;
  telefono: string | null;
  activo: boolean;
  /** Si el cliente tiene al menos una póliza, la identificación no se puede cambiar (D5). */
  tienePolizas: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Cliente extends Entity<PropsCliente> {
  private constructor(props: PropsCliente) {
    super(props);
  }

  static reconstituir(props: PropsCliente): Cliente {
    return new Cliente(props);
  }

  get tipoIdentificacion(): TipoIdentificacion {
    return this.props.tipoIdentificacion;
  }

  get identificacion(): string {
    return this.props.identificacion;
  }

  get nombres(): string | null {
    return this.props.nombres;
  }

  get apellidos(): string | null {
    return this.props.apellidos;
  }

  get razonSocial(): string | null {
    return this.props.razonSocial;
  }

  get email(): string {
    return this.props.email;
  }

  get telefono(): string | null {
    return this.props.telefono;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  get tienePolizas(): boolean {
    return this.props.tienePolizas;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get updatedAt(): string {
    return this.props.updatedAt;
  }

  get nombreCompleto(): string {
    if (this.props.razonSocial) {
      return this.props.razonSocial;
    }
    return [this.props.nombres, this.props.apellidos].filter(Boolean).join(' ');
  }
}
