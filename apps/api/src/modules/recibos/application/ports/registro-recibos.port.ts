export const REGISTRO_RECIBOS = Symbol('RegistroRecibosPort');

export interface EstadoEnCadena {
  existe: boolean;
  hashRecibo: string;
  registradoEn: number;
  anulado: boolean;
}

export interface ResultadoTransaccion {
  estado: 'pendiente' | 'confirmada' | 'revertida';
  blockNumber?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

export interface OpcionesEnvio {
  maxFeePerGasGwei: number;
}

/**
 * Puerto hacia el contrato RegistroRecibos (implementado con viem).
 * En el API es de solo lectura; el worker agrega la firma custodial.
 */
export interface RegistroRecibosPort {
  obtenerEnCadena(idOnchain: string): Promise<EstadoEnCadena>;
  enviarRegistro(
    idOnchain: string,
    hashRecibo: string,
    opciones: OpcionesEnvio,
  ): Promise<{ txHash: string }>;
  consultarTransaccion(txHash: string): Promise<ResultadoTransaccion>;
  anular(
    idOnchain: string,
    motivoHash: string,
    opciones: OpcionesEnvio,
  ): Promise<{ txHash: string }>;
}
