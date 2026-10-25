import { describe, expect, it } from 'vitest';

import { proponerPlanCuotas, sumarMontos } from '@oasis/shared';

describe('proponerPlanCuotas (HU-35, D12)', () => {
  it('reparte en centavos y la última cuota absorbe el residuo, con fechas a fin de mes', () => {
    expect(proponerPlanCuotas('100.00', 3, '2026-01-31')).toEqual([
      { numero: 1, valor: '33.33', fechaVencimiento: '2026-01-31' },
      { numero: 2, valor: '33.33', fechaVencimiento: '2026-02-28' },
      { numero: 3, valor: '33.34', fechaVencimiento: '2026-03-31' },
    ]);
  });

  it('con una sola cuota devuelve la prima en la fecha de inicio', () => {
    expect(proponerPlanCuotas('480.5', 1, '2026-10-05')).toEqual([
      { numero: 1, valor: '480.50', fechaVencimiento: '2026-10-05' },
    ]);
  });

  it('cruza el año y respeta los años bisiestos', () => {
    const plan = proponerPlanCuotas('120.00', 3, '2027-12-31');
    expect(plan.map((c) => c.fechaVencimiento)).toEqual(['2027-12-31', '2028-01-31', '2028-02-29']);
  });

  it('rechaza 0, 25 o un número no entero de cuotas', () => {
    expect(() => proponerPlanCuotas('100.00', 0, '2026-01-01')).toThrow(RangeError);
    expect(() => proponerPlanCuotas('100.00', 25, '2026-01-01')).toThrow(RangeError);
    expect(() => proponerPlanCuotas('100.00', 2.5, '2026-01-01')).toThrow(RangeError);
  });

  it('exige que cada cuota sea de al menos 0.01', () => {
    expect(() => proponerPlanCuotas('0.02', 3, '2026-01-01')).toThrow(RangeError);
    expect(proponerPlanCuotas('0.05', 3, '2026-01-01').map((c) => c.valor)).toEqual([
      '0.01',
      '0.01',
      '0.03',
    ]);
  });

  it('la suma de la propuesta siempre es igual a la prima', () => {
    for (const prima of ['0.03', '1.00', '99.99', '518.40', '1234567.89']) {
      for (const n of [1, 2, 3, 7, 11, 12, 24]) {
        if (Math.round(Number(prima) * 100) < n) continue;
        const plan = proponerPlanCuotas(prima, n, '2026-01-15');
        expect(sumarMontos(plan.map((c) => c.valor))).toBe(Number(prima).toFixed(2));
      }
    }
  });
});

describe('sumarMontos', () => {
  it('suma en centavos sin errores de coma flotante', () => {
    expect(sumarMontos(['0.10', '0.20'])).toBe('0.30');
    expect(sumarMontos(['33.33', '33.33', '33.34'])).toBe('100.00');
    expect(sumarMontos([])).toBe('0.00');
  });
});
