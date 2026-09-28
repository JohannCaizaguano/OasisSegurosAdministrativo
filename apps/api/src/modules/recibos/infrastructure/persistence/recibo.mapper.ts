import { Recibo, type PropsRecibo } from '../../domain/recibo';

export interface FilaRecibo {
  id: string;
  codigo: string;
  pagoId: string;
  idOnchain: string;
  hashRecibo: string;
  sal: string;
  payloadCanonico: string;
  estado: PropsRecibo['estado'];
  txHash: string | null;
  blockNumber: bigint | null;
  gasUsed: bigint | null;
  effectiveGasPrice: bigint | null;
  chainId: number;
  contractAddress: string;
  intentos: number;
  ultimoError: string | null;
  creadoEn: Date;
  enviadoEn: Date | null;
  ancladoEn: Date | null;
  pago?: { poliza?: { numero: string } };
}

export function mapearRecibo(fila: FilaRecibo): Recibo {
  return Recibo.reconstituir({
    id: fila.id,
    codigo: fila.codigo,
    pagoId: fila.pagoId,
    idOnchain: fila.idOnchain,
    hashRecibo: fila.hashRecibo,
    sal: fila.sal,
    payloadCanonico: fila.payloadCanonico,
    estado: fila.estado,
    txHash: fila.txHash,
    blockNumber: fila.blockNumber === null ? null : fila.blockNumber.toString(),
    gasUsed: fila.gasUsed === null ? null : fila.gasUsed.toString(),
    effectiveGasPrice: fila.effectiveGasPrice === null ? null : fila.effectiveGasPrice.toString(),
    chainId: fila.chainId,
    contractAddress: fila.contractAddress,
    intentos: fila.intentos,
    ultimoError: fila.ultimoError,
    creadoEn: fila.creadoEn.toISOString(),
    enviadoEn: fila.enviadoEn === null ? null : fila.enviadoEn.toISOString(),
    ancladoEn: fila.ancladoEn === null ? null : fila.ancladoEn.toISOString(),
    numeroPoliza: fila.pago?.poliza?.numero,
  });
}
