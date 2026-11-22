import { estadoDeCuota } from './estado-cuota';

const HOY = '2026-10-26';

describe('estadoDeCuota (al mover el vencimiento, D13)', () => {
  it('cubierta → PAGADA, aunque su fecha ya pasó', () => {
    expect(
      estadoDeCuota(
        { valor: '100.00', valorPagado: '100.00', fechaVencimiento: '2026-01-01' },
        HOY,
      ),
    ).toBe('PAGADA');
  });

  it('fecha pasada y no cubierta → VENCIDA', () => {
    expect(
      estadoDeCuota({ valor: '100.00', valorPagado: '40.00', fechaVencimiento: '2026-10-25' }, HOY),
    ).toBe('VENCIDA');
  });

  it('vence hoy o después sin abonos → PENDIENTE', () => {
    expect(
      estadoDeCuota({ valor: '100.00', valorPagado: '0.00', fechaVencimiento: HOY }, HOY),
    ).toBe('PENDIENTE');
  });

  it('vence después con abonos → PARCIAL', () => {
    expect(
      estadoDeCuota({ valor: '100.00', valorPagado: '0.01', fechaVencimiento: '2026-11-01' }, HOY),
    ).toBe('PARCIAL');
  });
});
