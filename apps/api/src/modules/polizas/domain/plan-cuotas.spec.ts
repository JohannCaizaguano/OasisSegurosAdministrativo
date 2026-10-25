import { PlanCuotas } from './plan-cuotas';

const POLIZA = { primaTotal: '100.00', fechaInicio: '2026-01-31', fechaFin: '2026-12-31' };

const TRES = [
  { numero: 1, valor: '33.33', fechaVencimiento: '2026-01-31' },
  { numero: 2, valor: '33.33', fechaVencimiento: '2026-02-28' },
  { numero: 3, valor: '33.34', fechaVencimiento: '2026-03-31' },
];

describe('PlanCuotas.validarContra (HU-35, D11)', () => {
  it('acepta un plan que suma la prima con fechas dentro de la vigencia', () => {
    expect(() => PlanCuotas.de(TRES).validarContra(POLIZA)).not.toThrow();
  });

  it('422 PLAN_NO_CUADRA con la suma y la prima si no cuadra (RN-15)', () => {
    const plan = PlanCuotas.de([{ ...TRES[0], valor: '30.00' }, TRES[1], TRES[2]]);
    expect(() => plan.validarContra(POLIZA)).toThrow(
      expect.objectContaining({
        codigo: 'REGLA_NEGOCIO',
        detalles: { campo: 'cuotas', motivo: 'PLAN_NO_CUADRA', suma: '96.67', prima: '100.00' },
      }),
    );
  });

  it('422 PLAN_FUERA_DE_VIGENCIA si una fecha cae antes del inicio o después del fin', () => {
    const antes = PlanCuotas.de([{ ...TRES[0], fechaVencimiento: '2026-01-30' }, TRES[1], TRES[2]]);
    expect(() => antes.validarContra(POLIZA)).toThrow(
      expect.objectContaining({
        detalles: { campo: 'cuotas.0.fechaVencimiento', motivo: 'PLAN_FUERA_DE_VIGENCIA' },
      }),
    );
    const despues = PlanCuotas.de([
      TRES[0],
      TRES[1],
      { ...TRES[2], fechaVencimiento: '2027-01-01' },
    ]);
    expect(() => despues.validarContra(POLIZA)).toThrow(
      expect.objectContaining({
        detalles: expect.objectContaining({ campo: 'cuotas.2.fechaVencimiento' }),
      }),
    );
  });

  it('acepta vencimientos en los extremos exactos de la vigencia', () => {
    const plan = PlanCuotas.de([
      { numero: 1, valor: '50.00', fechaVencimiento: '2026-01-31' },
      { numero: 2, valor: '50.00', fechaVencimiento: '2026-12-31' },
    ]);
    expect(() => plan.validarContra(POLIZA)).not.toThrow();
  });
});

describe('PlanCuotas.recalcularParaPrima (D13)', () => {
  it('con una cuota, la cuota toma la prima nueva y el vencimiento sigue al inicio', () => {
    const plan = PlanCuotas.de([{ numero: 1, valor: '100.00', fechaVencimiento: '2026-01-31' }]);
    expect(plan.recalcularParaPrima('250.00', '2026-02-15').cuotas).toEqual([
      { numero: 1, valor: '250.00', fechaVencimiento: '2026-02-15' },
    ]);
  });

  it('con N cuotas, recalcula los valores, conserva las fechas y sigue cuadrando', () => {
    const nuevo = PlanCuotas.de(TRES).recalcularParaPrima('200.00', '2026-01-31');
    expect(nuevo.cuotas).toEqual([
      { numero: 1, valor: '66.66', fechaVencimiento: '2026-01-31' },
      { numero: 2, valor: '66.66', fechaVencimiento: '2026-02-28' },
      { numero: 3, valor: '66.68', fechaVencimiento: '2026-03-31' },
    ]);
    expect(() => nuevo.validarContra({ ...POLIZA, primaTotal: '200.00' })).not.toThrow();
  });
});
