import { describe, expect, it } from 'vitest';

import {
  cuotaSchema,
  filaCarteraSchema,
  listarCarteraQuerySchema,
  listarPagosQuerySchema,
  pagoDetalleSchema,
  VISTAS_CARTERA,
} from '@oasis/shared';

const ID = '7b1e3c2a-4d5f-4a6b-8c9d-0e1f2a3b4c5d';

describe('listarPagosQuerySchema (HU-20, D15)', () => {
  it('admite el filtro de cliente', () => {
    const resultado = listarPagosQuerySchema.safeParse({ clienteId: ID });
    expect(resultado.success && resultado.data.clienteId).toBe(ID);
    expect(listarPagosQuerySchema.safeParse({ clienteId: 'Ana' }).success).toBe(false);
  });

  it('rechaza un rango con «desde» posterior a «hasta», en el campo «hasta»', () => {
    const resultado = listarPagosQuerySchema.safeParse({
      desde: '2026-11-10',
      hasta: '2026-11-01',
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues.map((issue) => issue.path)).toEqual([['hasta']]);
    expect(
      listarPagosQuerySchema.safeParse({ desde: '2026-11-01', hasta: '2026-11-01' }).success,
    ).toBe(true);
  });
});

describe('pagoDetalleSchema (HU-36, D14)', () => {
  const pago = {
    id: ID,
    polizaId: ID,
    monto: '50.00',
    fechaPago: '2026-11-03',
    metodo: 'TRANSFERENCIA',
    referencia: 'T-1',
    estado: 'VALIDADO',
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
  };

  it('lleva las cuotas a las que se aplicó y su recibo', () => {
    expect(
      pagoDetalleSchema.safeParse({
        ...pago,
        aplicaciones: [
          { cuotaNumero: 1, monto: '33.33' },
          { cuotaNumero: 2, monto: '16.67' },
        ],
        recibo: { id: ID, codigo: 'RC-0123456789AB', estado: 'ANCLADO' },
      }).success,
    ).toBe(true);
    expect(
      pagoDetalleSchema.safeParse({ ...pago, estado: 'REGISTRADO', aplicaciones: [], recibo: null })
        .success,
    ).toBe(true);
    expect(pagoDetalleSchema.safeParse(pago).success).toBe(false);
  });
});

describe('cuotaSchema con aplicaciones (HU-36, D14)', () => {
  it('lleva los pagos aplicados a cada cuota', () => {
    const cuota = {
      id: ID,
      numero: 1,
      valor: '33.33',
      valorPagado: '33.33',
      fechaVencimiento: '2026-11-30',
      estado: 'PAGADA',
      aplicaciones: [{ pagoId: ID, monto: '33.33', fecha: '2026-11-04T10:00:00.000Z' }],
    };
    expect(cuotaSchema.safeParse(cuota).success).toBe(true);
    expect(cuotaSchema.safeParse({ ...cuota, aplicaciones: undefined }).success).toBe(false);
  });
});

describe('cartera (HU-38, D16)', () => {
  it('tiene las tres vistas', () => {
    expect(VISTAS_CARTERA).toEqual(['POR_VENCER', 'VENCIDAS', 'TODAS']);
  });

  it('usa TODAS si no llega la vista y rechaza una vista inválida', () => {
    const resultado = listarCarteraQuerySchema.safeParse({});
    expect(resultado.success && resultado.data).toEqual({ vista: 'TODAS', page: 1, pageSize: 20 });
    expect(listarCarteraQuerySchema.safeParse({ vista: 'AL_DIA' }).success).toBe(false);
  });

  it('admite cliente, aseguradora y rango de vencimiento', () => {
    const resultado = listarCarteraQuerySchema.safeParse({
      vista: 'VENCIDAS',
      clienteId: ID,
      aseguradoraId: ID,
      desde: '2026-11-01',
      hasta: '2026-11-30',
      page: '2',
    });
    expect(resultado.success && resultado.data.page).toBe(2);
  });

  it('rechaza «desde» posterior a «hasta», en el campo «hasta»', () => {
    const resultado = listarCarteraQuerySchema.safeParse({
      desde: '2026-11-10',
      hasta: '2026-11-01',
    });
    expect(resultado.error?.issues.map((issue) => issue.path)).toEqual([['hasta']]);
  });

  it('describe una fila con cliente, póliza, cuota, pendiente y atraso', () => {
    const fila = {
      cuotaId: ID,
      numero: 2,
      valor: '33.33',
      pendiente: '13.33',
      fechaVencimiento: '2026-10-31',
      diasAtraso: 3,
      estado: 'VENCIDA',
      poliza: {
        id: ID,
        numero: 'POL-001',
        ramo: 'Vehículos',
        ramoCodigo: 'VEHICULOS',
        aseguradora: 'Seguros Equinoccial',
      },
      cliente: { id: ID, nombre: 'Ana Pérez' },
    };
    expect(filaCarteraSchema.safeParse(fila).success).toBe(true);
    expect(filaCarteraSchema.safeParse({ ...fila, diasAtraso: -1 }).success).toBe(false);
    expect(filaCarteraSchema.safeParse({ ...fila, estado: 'PAGADA' }).success).toBe(false);
  });
});
