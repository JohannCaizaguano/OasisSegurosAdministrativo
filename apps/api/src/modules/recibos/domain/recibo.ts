import type { EstadoRecibo } from '@oasis/shared';

import { Entity } from '../../../shared-kernel/entity';
import { ReglaNegocioError } from '../../../shared-kernel/domain-error';

export interface DatosNuevoRecibo {
  id: string;
  codigo: string;
  pagoId: string;
  idOnchain: string;
  hashRecibo: string;
  sal: string;
  payloadCanonico: string;
  chainId: number;
  contractAddress: string;
  creadoEn: string;
}

export interface PropsRecibo extends DatosNuevoRecibo {
  estado: EstadoRecibo;
  txHash: string | null;
  blockNumber: string | null;
  gasUsed: string | null;
  effectiveGasPrice: string | null;
  intentos: number;
  ultimoError: string | null;
  enviadoEn: string | null;
  ancladoEn: string | null;
  numeroPoliza?: string;
}

export interface DatosAnclaje {
  blockNumber: string | null;
  gasUsed: string | null;
  effectiveGasPrice: string | null;
}

export class Recibo extends Entity<PropsRecibo> {
  private constructor(props: PropsRecibo) {
    super(props);
  }

  static nuevo(datos: DatosNuevoRecibo): Recibo {
    return new Recibo({
      ...datos,
      estado: 'PENDIENTE_ANCLAJE',
      txHash: null,
      blockNumber: null,
      gasUsed: null,
      effectiveGasPrice: null,
      intentos: 0,
      ultimoError: null,
      enviadoEn: null,
      ancladoEn: null,
    });
  }

  static reconstituir(props: PropsRecibo): Recibo {
    return new Recibo(props);
  }

  get codigo(): string {
    return this.props.codigo;
  }

  get pagoId(): string {
    return this.props.pagoId;
  }

  get idOnchain(): string {
    return this.props.idOnchain;
  }

  get hashRecibo(): string {
    return this.props.hashRecibo;
  }

  get sal(): string {
    return this.props.sal;
  }

  get payloadCanonico(): string {
    return this.props.payloadCanonico;
  }

  get estado(): EstadoRecibo {
    return this.props.estado;
  }

  get txHash(): string | null {
    return this.props.txHash;
  }

  get blockNumber(): string | null {
    return this.props.blockNumber;
  }

  get gasUsed(): string | null {
    return this.props.gasUsed;
  }

  get effectiveGasPrice(): string | null {
    return this.props.effectiveGasPrice;
  }

  get chainId(): number {
    return this.props.chainId;
  }

  get contractAddress(): string {
    return this.props.contractAddress;
  }

  get intentos(): number {
    return this.props.intentos;
  }

  get ultimoError(): string | null {
    return this.props.ultimoError;
  }

  get creadoEn(): string {
    return this.props.creadoEn;
  }

  get enviadoEn(): string | null {
    return this.props.enviadoEn;
  }

  get ancladoEn(): string | null {
    return this.props.ancladoEn;
  }

  get numeroPoliza(): string | undefined {
    return this.props.numeroPoliza;
  }

  estaAnclado(): boolean {
    return this.props.estado === 'ANCLADO';
  }

  estaAnulado(): boolean {
    return this.props.estado === 'ANULADO';
  }

  marcarEnviado(txHash: string, fecha: Date): void {
    if (this.estaAnclado() || this.estaAnulado()) {
      throw new ReglaNegocioError(`No se puede enviar un recibo en estado ${this.props.estado}`);
    }
    this.props.txHash = txHash;
    this.props.estado = 'ENVIADO';
    this.props.enviadoEn = fecha.toISOString();
  }

  marcarAnclado(datos: DatosAnclaje, fecha: Date): void {
    if (this.estaAnulado()) {
      throw new ReglaNegocioError('No se puede anclar un recibo anulado');
    }
    this.props.estado = 'ANCLADO';
    this.props.blockNumber = datos.blockNumber;
    this.props.gasUsed = datos.gasUsed;
    this.props.effectiveGasPrice = datos.effectiveGasPrice;
    this.props.ancladoEn = fecha.toISOString();
    this.props.ultimoError = null;
  }

  marcarFallido(error: string): void {
    if (this.estaAnclado() || this.estaAnulado()) {
      throw new ReglaNegocioError(
        `No se puede marcar como fallido un recibo en estado ${this.props.estado}`,
      );
    }
    this.props.estado = 'FALLIDO';
    this.props.ultimoError = error;
  }

  reintentar(): void {
    if (this.props.estado !== 'FALLIDO') {
      throw new ReglaNegocioError('Solo se pueden reintentar recibos en estado FALLIDO');
    }
    this.props.estado = 'PENDIENTE_ANCLAJE';
    this.props.ultimoError = null;
  }

  anular(): void {
    if (this.estaAnulado()) {
      throw new ReglaNegocioError('El recibo ya está anulado');
    }
    this.props.estado = 'ANULADO';
  }

  registrarIntento(error?: string): void {
    this.props.intentos += 1;
    if (error) {
      this.props.ultimoError = error;
    }
  }
}
