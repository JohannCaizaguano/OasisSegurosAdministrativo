import type { EstadoPago, MetodoPago } from '@oasis/shared';

import { Entity } from '../../../shared-kernel/entity';

export interface PropsPago {
  id: string;
  polizaId: string;
  numeroPoliza?: string;
  monto: string;
  fechaPago: string;
  metodoPagoId: string;
  /** Código del método de pago (catálogo `MetodoPago`). */
  metodo: MetodoPago;
  referencia: string | null;
  estado: EstadoPago;
  registradoPorId: string | null;
  validadoPorId: string | null;
  validadoEn: string | null;
  /** Motivo obligatorio del rechazo (HU-19). */
  motivoRechazo: string | null;
  /** Nota de auditoría del operador. Interna: nunca se ancla. */
  nota: string | null;
  createdAt: string;
  updatedAt: string;
}

export class Pago extends Entity<PropsPago> {
  private constructor(props: PropsPago) {
    super(props);
  }

  static reconstituir(props: PropsPago): Pago {
    return new Pago(props);
  }

  get polizaId(): string {
    return this.props.polizaId;
  }

  get numeroPoliza(): string | undefined {
    return this.props.numeroPoliza;
  }

  get monto(): string {
    return this.props.monto;
  }

  get fechaPago(): string {
    return this.props.fechaPago;
  }

  get metodo(): MetodoPago {
    return this.props.metodo;
  }

  get metodoPagoId(): string {
    return this.props.metodoPagoId;
  }

  get referencia(): string | null {
    return this.props.referencia;
  }

  get estado(): EstadoPago {
    return this.props.estado;
  }

  get registradoPorId(): string | null {
    return this.props.registradoPorId;
  }

  get validadoPorId(): string | null {
    return this.props.validadoPorId;
  }

  get validadoEn(): string | null {
    return this.props.validadoEn;
  }

  get motivoRechazo(): string | null {
    return this.props.motivoRechazo;
  }

  get nota(): string | null {
    return this.props.nota;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get updatedAt(): string {
    return this.props.updatedAt;
  }

  puedeValidarse(): boolean {
    return this.props.estado === 'REGISTRADO';
  }

  puedeRechazarse(): boolean {
    return this.props.estado === 'REGISTRADO';
  }
}
