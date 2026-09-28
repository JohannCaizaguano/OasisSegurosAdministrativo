import { duracionASegundos } from './duracion';

describe('duracionASegundos', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['2h', 7_200],
    ['7d', 604_800],
  ])('convierte %s a %d segundos', (entrada, esperado) => {
    expect(duracionASegundos(entrada)).toBe(esperado);
  });

  it('rechaza duraciones inválidas', () => {
    expect(() => duracionASegundos('siete dias')).toThrow();
  });
});
