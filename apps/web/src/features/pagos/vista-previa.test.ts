import type { Cuota } from '@oasis/shared';
import { describe, expect, it } from 'vitest';

import { vistaPreviaAplicacion } from './vista-previa';

const HOY = '2026-10-25';

function cuota(numero: number, cambios: Partial<Cuota> = {}): Cuota {
  return {
    id: `c${numero}`,
    numero,
    valor: '120.00',
    valorPagado: '0.00',
    fechaVencimiento: `2026-1${numero}-01`,
    estado: 'PENDIENTE',
    aplicaciones: [],
    ...cambios,
  };
}

describe('vistaPreviaAplicacion (D24)', () => {
  it('$160 sobre $120 y $120: la cuota 1 queda Pagada y la 2 recibe $40,00', () => {
    const vista = vistaPreviaAplicacion([cuota(1), cuota(2)], '160.00', HOY);
    expect(vista).toEqual({
      tipo: 'aplicacion',
      frase: 'la cuota 1 queda Pagada y la cuota 2 recibe $40,00 (Pago parcial)',
      fraseCondicional: 'la cuota 1 quedaría Pagada y la cuota 2 recibiría $40,00 (Pago parcial)',
    });
  });

  it('una cuota vencida cubierta en parte sigue Vencida', () => {
    const vista = vistaPreviaAplicacion(
      [cuota(1, { fechaVencimiento: '2026-09-01', estado: 'VENCIDA' })],
      '20.00',
      HOY,
    );
    expect(vista).toMatchObject({ frase: 'la cuota 1 recibe $20,00 (sigue Vencida)' });
  });

  it('tres cuotas se enumeran con comas y la última con «y»', () => {
    const vista = vistaPreviaAplicacion([cuota(1), cuota(2), cuota(3)], '360.00', HOY);
    expect(vista).toMatchObject({
      frase: 'la cuota 1 queda Pagada, la cuota 2 queda Pagada y la cuota 3 queda Pagada',
    });
  });

  it('un monto mayor que lo pendiente devuelve el aviso de saldo con lo pendiente', () => {
    const vista = vistaPreviaAplicacion(
      [cuota(1, { valorPagado: '100.00', estado: 'PARCIAL' }), cuota(2)],
      '200.00',
      HOY,
    );
    expect(vista).toEqual({ tipo: 'supera-saldo', pendiente: '140.00' });
  });

  it('un monto vacío o no positivo no da vista previa', () => {
    expect(vistaPreviaAplicacion([cuota(1)], '', HOY)).toBeNull();
    expect(vistaPreviaAplicacion([cuota(1)], '0', HOY)).toBeNull();
    expect(vistaPreviaAplicacion([cuota(1)], 'abc', HOY)).toBeNull();
  });
});
