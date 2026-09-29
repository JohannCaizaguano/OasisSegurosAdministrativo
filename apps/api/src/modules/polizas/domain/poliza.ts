import type { EstadoPoliza } from '@oasis/shared';

import { Entity } from '../../../shared-kernel/entity';

export interface PropsPoliza {
  id: string;
  numero: string;
  clienteId: string;
  aseguradoraId: string;
  ramoId: string;
  /** Nombre visible del ramo (catálogo `Ramo`). */
  ramo: string;
  primaTotal: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPoliza;
  clienteNombre?: string;
  aseguradoraNombre?: string;
  createdAt: string;
  updatedAt: string;
}

export class Poliza extends Entity<PropsPoliza> {
  private constructor(props: PropsPoliza) {
    super(props);
  }

  static reconstituir(props: PropsPoliza): Poliza {
    return new Poliza(props);
  }

  get numero(): string {
    return this.props.numero;
  }

  get clienteId(): string {
    return this.props.clienteId;
  }

  get aseguradoraId(): string {
    return this.props.aseguradoraId;
  }

  get ramoId(): string {
    return this.props.ramoId;
  }

  get ramo(): string {
    return this.props.ramo;
  }

  get primaTotal(): string {
    return this.props.primaTotal;
  }

  get fechaInicio(): string {
    return this.props.fechaInicio;
  }

  get fechaFin(): string {
    return this.props.fechaFin;
  }

  get estado(): EstadoPoliza {
    return this.props.estado;
  }

  get clienteNombre(): string | undefined {
    return this.props.clienteNombre;
  }

  get aseguradoraNombre(): string | undefined {
    return this.props.aseguradoraNombre;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get updatedAt(): string {
    return this.props.updatedAt;
  }
}
