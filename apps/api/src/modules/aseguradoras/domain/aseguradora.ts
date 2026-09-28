import { Entity } from '../../../shared-kernel/entity';

export interface PropsAseguradora {
  id: string;
  nombre: string;
  ruc: string;
  createdAt: string;
  updatedAt: string;
}

export class Aseguradora extends Entity<PropsAseguradora> {
  private constructor(props: PropsAseguradora) {
    super(props);
  }

  static reconstituir(props: PropsAseguradora): Aseguradora {
    return new Aseguradora(props);
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get ruc(): string {
    return this.props.ruc;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get updatedAt(): string {
    return this.props.updatedAt;
  }
}
