import { periodoEnEcuador } from './periodo-ecuador';

describe('periodoEnEcuador', () => {
  it('convierte el inicio del día de Ecuador al instante UTC correcto', () => {
    expect(periodoEnEcuador('2026-10-01').desde?.toISOString()).toBe('2026-10-01T05:00:00.000Z');
  });

  it('el límite superior es exclusivo: abarca el día completo de Ecuador', () => {
    expect(periodoEnEcuador(undefined, '2026-10-01').hastaExclusivo?.toISOString()).toBe(
      '2026-10-02T05:00:00.000Z',
    );
  });

  it('sin fechas no acota el periodo', () => {
    expect(periodoEnEcuador()).toEqual({ desde: undefined, hastaExclusivo: undefined });
  });
});
