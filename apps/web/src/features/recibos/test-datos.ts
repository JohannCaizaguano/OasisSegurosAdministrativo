import type { ReciboDetalle, ReciboImprimible } from '@oasis/shared';

export const RECIBO_ID = '9b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';

export function reciboDetalle(cambios: Partial<ReciboDetalle> = {}): ReciboDetalle {
  return {
    id: RECIBO_ID,
    codigo: 'RC-0123456789AB',
    estado: 'ANCLADO',
    idOnchain: `0x${'1'.repeat(64)}`,
    hashRecibo: `0x${'a'.repeat(64)}`,
    txHash: `0x${'b'.repeat(64)}`,
    creadoEn: '2026-10-20T15:00:00.000Z',
    enviadoEn: '2026-10-20T15:00:05.000Z',
    ancladoEn: '2026-10-20T15:00:12.000Z',
    pagoId: '7c1e5a90-2b3d-4f6a-9e8c-1d2b3a4c5d6e',
    numeroPoliza: 'POL-0001',
    blockNumber: '120',
    gasUsed: '51000',
    effectiveGasPrice: '1000',
    chainId: 80002,
    contractAddress: `0x${'c'.repeat(40)}`,
    intentos: 1,
    ultimoError: null,
    explorerUrl: `https://amoy.polygonscan.com/tx/0x${'b'.repeat(64)}`,
    ...cambios,
  };
}

export const RECIBO_IMPRIMIBLE: ReciboImprimible = {
  codigo: 'RC-0123456789AB',
  estadoAnclaje: 'ANCLADO',
  emitidoEn: '2026-10-20T15:00:00.000Z',
  ancladoEn: '2026-10-20T15:00:12.000Z',
  explorerUrl: `https://amoy.polygonscan.com/tx/0x${'b'.repeat(64)}`,
  pago: {
    monto: '1234.50',
    fechaPago: '2026-10-19',
    metodo: 'DEBITO_BANCARIO',
    referencia: 'DB-0009',
  },
  poliza: { numero: 'POL-0001', ramo: 'Vida', aseguradora: 'Seguros Unidos' },
  cliente: { nombre: 'Ana Pérez', identificacionEnmascarada: '******4065' },
};
