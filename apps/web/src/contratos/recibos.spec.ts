import { describe, expect, it } from 'vitest';

import {
  enmascararIdentificacion,
  ESTADOS_VERIFICACION,
  pagoClienteSchema,
  reciboDetalleSchema,
  reciboImprimibleSchema,
} from '@oasis/shared';

const ID = '7b1e3c2a-4d5f-4a6b-8c9d-0e1f2a3b4c5d';
const HEX32 = `0x${'ab'.repeat(32)}`;

describe('códigos de verificación (HU-28, D2)', () => {
  it('son exactamente los cinco resultados del criterio, en su orden', () => {
    expect(ESTADOS_VERIFICACION).toEqual([
      'AUTENTICO',
      'NO_COINCIDE',
      'EN_PROCESO',
      'ANULADO',
      'NO_ENCONTRADO',
    ]);
  });
});

describe('reciboDetalleSchema (HU-25, D6)', () => {
  const detalle = {
    id: ID,
    codigo: 'RC-0123456789AB',
    estado: 'ANCLADO',
    idOnchain: HEX32,
    hashRecibo: HEX32,
    txHash: HEX32,
    creadoEn: '2026-11-04T10:00:00.000Z',
    enviadoEn: '2026-11-04T10:00:05.000Z',
    ancladoEn: '2026-11-04T10:00:10.000Z',
    pagoId: ID,
    numeroPoliza: 'POL-001',
    blockNumber: '42',
    chainId: 80002,
    contractAddress: '0x0000000000000000000000000000000000000001',
    intentos: 1,
    explorerUrl: 'https://amoy.polygonscan.com',
  };

  it('acepta el detalle sin datos internos', () => {
    expect(reciboDetalleSchema.safeParse(detalle).success).toBe(true);
  });

  it('rechaza el payload canónico y la sal', () => {
    expect(reciboDetalleSchema.safeParse({ ...detalle, payloadCanonico: '{}' }).success).toBe(
      false,
    );
    expect(reciboDetalleSchema.safeParse({ ...detalle, sal: HEX32 }).success).toBe(false);
  });
});

describe('reciboImprimibleSchema (HU-25, D7)', () => {
  const imprimible = {
    codigo: 'RC-0123456789AB',
    estadoAnclaje: 'ANCLADO',
    emitidoEn: '2026-11-04T10:00:00.000Z',
    ancladoEn: '2026-11-04T10:00:10.000Z',
    explorerUrl: `https://amoy.polygonscan.com/tx/${HEX32}`,
    pago: { monto: '120.50', fechaPago: '2026-11-03', metodo: 'TRANSFERENCIA', referencia: 'T-1' },
    poliza: { numero: 'POL-001', ramo: 'Vehículos', aseguradora: 'Seguros Equinoccial' },
    cliente: { nombre: 'Ana Pérez', identificacionEnmascarada: '******4065' },
  };

  it('acepta el recibo imprimible, aún sin anclar', () => {
    expect(reciboImprimibleSchema.safeParse(imprimible).success).toBe(true);
    expect(
      reciboImprimibleSchema.safeParse({
        ...imprimible,
        estadoAnclaje: 'PENDIENTE_ANCLAJE',
        ancladoEn: null,
        explorerUrl: null,
      }).success,
    ).toBe(true);
  });

  it('rechaza datos internos o la identificación completa', () => {
    expect(reciboImprimibleSchema.safeParse({ ...imprimible, sal: HEX32 }).success).toBe(false);
    expect(
      reciboImprimibleSchema.safeParse({
        ...imprimible,
        cliente: { ...imprimible.cliente, identificacion: '1710034065' },
      }).success,
    ).toBe(false);
  });
});

describe('pagoClienteSchema (/mis-pagos, D7)', () => {
  const pago = {
    id: ID,
    polizaId: ID,
    numeroPoliza: 'POL-001',
    monto: '10.00',
    fechaPago: '2026-11-03',
    metodo: 'TRANSFERENCIA',
    referencia: 'T-1',
    estado: 'VALIDADO',
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
  };

  it('lleva el recibo del pago validado o null', () => {
    const conRecibo = pagoClienteSchema.safeParse({
      ...pago,
      recibo: { id: ID, codigo: 'RC-0123456789AB' },
    });
    expect(conRecibo.success && conRecibo.data.recibo?.codigo).toBe('RC-0123456789AB');
    expect(
      pagoClienteSchema.safeParse({ ...pago, estado: 'REGISTRADO', recibo: null }).success,
    ).toBe(true);
    expect(pagoClienteSchema.safeParse(pago).success).toBe(false);
  });
});

describe('enmascararIdentificacion (HU-25, D7)', () => {
  it('deja visibles los 4 últimos dígitos de una cédula', () => {
    expect(enmascararIdentificacion('1710034065')).toBe('******4065');
  });

  it('enmascara un RUC de 13 dígitos', () => {
    expect(enmascararIdentificacion('1790012345001')).toBe('*********5001');
  });

  it('enmascara un pasaporte alfanumérico', () => {
    expect(enmascararIdentificacion('AB12C34')).toBe('***2C34');
  });

  it('enmascara todo con menos de 5 caracteres', () => {
    expect(enmascararIdentificacion('A1B2')).toBe('****');
  });
});
