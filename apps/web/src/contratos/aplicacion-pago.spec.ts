import { describe, expect, it } from 'vitest';

import { aplicarPagoACuotas, type CuotaAplicable } from '@oasis/shared';

const HOY = '2026-11-04';

const plan: CuotaAplicable[] = [
  {
    id: 'c1',
    numero: 1,
    valor: '33.33',
    valorPagado: '0.00',
    fechaVencimiento: '2026-11-30',
    estado: 'PENDIENTE',
  },
  {
    id: 'c2',
    numero: 2,
    valor: '33.33',
    valorPagado: '0.00',
    fechaVencimiento: '2026-12-30',
    estado: 'PENDIENTE',
  },
  {
    id: 'c3',
    numero: 3,
    valor: '33.34',
    valorPagado: '0.00',
    fechaVencimiento: '2027-01-30',
    estado: 'PENDIENTE',
  },
];

describe('aplicarPagoACuotas (HU-36, D11, D24)', () => {
  it('cubre la primera cuota y abona el resto a la segunda, que queda PARCIAL', () => {
    expect(aplicarPagoACuotas(plan, '50.00', HOY)).toEqual({
      aplicaciones: [
        { cuotaId: 'c1', monto: '33.33' },
        { cuotaId: 'c2', monto: '16.67' },
      ],
      cuotas: [
        { id: 'c1', valorPagado: '33.33', estado: 'PAGADA' },
        { id: 'c2', valorPagado: '16.67', estado: 'PARCIAL' },
      ],
    });
  });

  it('con el total exacto deja todas las cuotas PAGADAS', () => {
    const { cuotas } = aplicarPagoACuotas(plan, '100.00', HOY);
    expect(cuotas.map((cuota) => cuota.estado)).toEqual(['PAGADA', 'PAGADA', 'PAGADA']);
  });

  it('una cuota con fecha pasada cubierta en parte queda VENCIDA, aunque estuviera PENDIENTE', () => {
    expect(aplicarPagoACuotas([plan[0]], '10.00', '2026-12-01').cuotas).toEqual([
      { id: 'c1', valorPagado: '10.00', estado: 'VENCIDA' },
    ]);
  });

  it('una cuota VENCIDA que vence hoy, cubierta en parte, queda PARCIAL', () => {
    const vencida: CuotaAplicable = { ...plan[0], estado: 'VENCIDA' };
    expect(aplicarPagoACuotas([vencida], '10.00', '2026-11-30').cuotas).toEqual([
      { id: 'c1', valorPagado: '10.00', estado: 'PARCIAL' },
    ]);
  });

  it('una cuota VENCIDA cubierta del todo queda PAGADA', () => {
    const vencida: CuotaAplicable = { ...plan[0], estado: 'VENCIDA', valorPagado: '10.00' };
    expect(aplicarPagoACuotas([vencida], '23.33', HOY)).toEqual({
      aplicaciones: [{ cuotaId: 'c1', monto: '23.33' }],
      cuotas: [{ id: 'c1', valorPagado: '33.33', estado: 'PAGADA' }],
    });
  });

  it('salta las cuotas PAGADAS y completa una PARCIAL', () => {
    const cuotas: CuotaAplicable[] = [
      { ...plan[0], valorPagado: '33.33', estado: 'PAGADA' },
      { ...plan[1], valorPagado: '16.67', estado: 'PARCIAL' },
      plan[2],
    ];
    expect(aplicarPagoACuotas(cuotas, '20.00', HOY).aplicaciones).toEqual([
      { cuotaId: 'c2', monto: '16.66' },
      { cuotaId: 'c3', monto: '3.34' },
    ]);
  });

  it('ordena por vencimiento y luego por número, aunque lleguen desordenadas', () => {
    const cuotas: CuotaAplicable[] = [
      { ...plan[2], numero: 1 },
      { ...plan[1], id: 'c2b', numero: 3, fechaVencimiento: '2026-11-30' },
      { ...plan[0], numero: 2 },
    ];
    expect(aplicarPagoACuotas(cuotas, '40.00', HOY).aplicaciones).toEqual([
      { cuotaId: 'c1', monto: '33.33' },
      { cuotaId: 'c2b', monto: '6.67' },
    ]);
  });

  it('no acepta un monto mayor que lo pendiente ni uno no positivo', () => {
    expect(() => aplicarPagoACuotas(plan, '100.01', HOY)).toThrow(RangeError);
    expect(() => aplicarPagoACuotas(plan, '0.00', HOY)).toThrow(RangeError);
  });

  it('no modifica las cuotas recibidas', () => {
    const copia = structuredClone(plan);
    aplicarPagoACuotas(plan, '50.00', HOY);
    expect(plan).toEqual(copia);
  });
});
