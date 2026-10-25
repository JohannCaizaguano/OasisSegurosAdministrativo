import { describe, expect, it } from 'vitest';

import { formatearFecha, formatearFechaHoraEcuador, formatearMoneda } from './format';

describe('formatearMoneda', () => {
  it('escribe dólares con el formato de Ecuador', () => {
    expect(formatearMoneda('1234.5')).toBe('$1.234,50');
    expect(formatearMoneda(0.5)).toBe('$0,50');
  });

  it('trata un valor no numérico como cero', () => {
    expect(formatearMoneda('abc')).toBe('$0,00');
  });
});

describe('formatearFecha', () => {
  it('escribe una fecha sin hora como dd/mm/aaaa, sin depender de la zona', () => {
    expect(formatearFecha('2026-10-06')).toBe('06/10/2026');
    expect(formatearFecha('2026-01-01')).toBe('01/01/2026');
  });

  it('escribe un instante como dd/mm/aaaa y la hora de Ecuador en 24 h', () => {
    expect(formatearFecha('2026-10-06T15:30:00.000Z')).toBe('06/10/2026, 10:30');
    expect(formatearFecha('2026-10-07T02:05:00.000Z')).toBe('06/10/2026, 21:05');
  });

  it('muestra un guion largo si no hay fecha', () => {
    expect(formatearFecha(null)).toBe('—');
    expect(formatearFecha(undefined)).toBe('—');
  });
});

describe('formatearFechaHoraEcuador', () => {
  it('incluye los segundos, en la hora de Ecuador', () => {
    expect(formatearFechaHoraEcuador('2026-10-06T15:30:00.000Z')).toBe('06/10/2026, 10:30:00');
  });
});
