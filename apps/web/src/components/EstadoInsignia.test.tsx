import {
  ESTADOS_CUOTA,
  ESTADOS_PAGO,
  ESTADOS_POLIZA,
  ESTADOS_RECIBO,
  ESTADOS_VERIFICACION,
} from '@oasis/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { EstadoInsignia } from './EstadoInsignia';
import { ESTADOS, ESTADOS_CLIENTE, ESTADOS_CUENTA, type Dominio, type Tono } from './estados';

afterEach(cleanup);

/** Vocabulario de DESIGN.md §Insignias y del plan S4 (T4): texto y tono por estado. */
const ESPERADO: Record<Dominio, Record<string, [string, Tono]>> = {
  pago: {
    REGISTRADO: ['Por validar', 'proceso'],
    VALIDADO: ['Validado', 'exito'],
    RECHAZADO: ['Rechazado', 'error'],
  },
  recibo: {
    PENDIENTE_ANCLAJE: ['En proceso', 'proceso'],
    ENVIADO: ['En proceso', 'proceso'],
    ANCLADO: ['Verificable', 'exito'],
    FALLIDO: ['Requiere atención', 'aviso'],
    ANULADO: ['Anulado', 'neutro'],
  },
  poliza: {
    VIGENTE: ['Vigente', 'exito'],
    VENCIDA: ['Vencida', 'error'],
    CANCELADA: ['Cancelada', 'neutro'],
    EN_MORA: ['En mora', 'error'],
  },
  cliente: {
    ACTIVO: ['Activo', 'exito'],
    DESACTIVADO: ['Desactivado', 'neutro'],
  },
  verificacion: {
    VALIDO: ['Auténtico', 'exito'],
    HASH_INCONSISTENTE: ['No coincide', 'error'],
    NO_ANCLADO: ['En proceso', 'proceso'],
    ANULADO: ['Anulado', 'neutro'],
    NO_ENCONTRADO: ['No encontrado', 'error'],
  },
  cuota: {
    PENDIENTE: ['Pendiente', 'neutro'],
    PARCIAL: ['Pago parcial', 'aviso'],
    PAGADA: ['Pagada', 'exito'],
    VENCIDA: ['Vencida', 'error'],
  },
  cuenta: {
    ACTIVA: ['Activa', 'exito'],
    DESACTIVADA: ['Desactivada', 'neutro'],
  },
};

const CONSTANTES: Record<Dominio, readonly string[]> = {
  pago: ESTADOS_PAGO,
  recibo: ESTADOS_RECIBO,
  poliza: [...ESTADOS_POLIZA, 'EN_MORA'],
  cliente: ESTADOS_CLIENTE,
  verificacion: ESTADOS_VERIFICACION,
  cuota: ESTADOS_CUOTA,
  cuenta: ESTADOS_CUENTA,
};

const DOMINIOS = Object.keys(CONSTANTES) as Dominio[];

describe('estados — vocabulario exhaustivo', () => {
  it.each(DOMINIOS)('el dominio %s cubre exactamente sus estados de @oasis/shared', (dominio) => {
    expect(Object.keys(ESTADOS[dominio]).sort()).toEqual([...CONSTANTES[dominio]].sort());
  });

  it('un mismo texto usa siempre el mismo icono y el mismo tono', () => {
    const vistos = new Map<string, unknown>();
    for (const dominio of DOMINIOS) {
      for (const { texto, icono, tono } of Object.values(ESTADOS[dominio])) {
        const previo = vistos.get(texto);
        if (previo) {
          expect({ texto, icono, tono }).toEqual(previo);
        }
        vistos.set(texto, { texto, icono, tono });
      }
    }
  });
});

describe('EstadoInsignia', () => {
  const casos = DOMINIOS.flatMap((dominio) =>
    CONSTANTES[dominio].map((estado) => [dominio, estado] as const),
  );

  it.each(casos)('%s · %s muestra su texto, su icono oculto y su tono', (dominio, estado) => {
    const [texto, tono] = ESPERADO[dominio][estado];
    const { container } = render(
      // @ts-expect-error -- el recorrido genérico no estrecha el estado al dominio
      <EstadoInsignia dominio={dominio} estado={estado} />,
    );

    const insignia = screen.getByText(texto);
    expect(insignia).toHaveClass(`bg-estado-${tono}-fondo`, `text-estado-${tono}`);
    expect(insignia).toHaveAttribute('data-tono', tono);
    const icono = container.querySelector('svg');
    expect(icono).not.toBeNull();
    expect(icono).toHaveAttribute('aria-hidden', 'true');
    expect(insignia).toContainElement(icono as SVGElement);
  });

  it('el texto es el nombre accesible y no repite el código técnico', () => {
    render(<EstadoInsignia dominio="recibo" estado="PENDIENTE_ANCLAJE" />);

    expect(screen.getByText('En proceso')).toHaveTextContent(/^En proceso$/);
    expect(screen.queryByText(/PENDIENTE_ANCLAJE/)).not.toBeInTheDocument();
  });

  it('acepta clases adicionales sin perder el tono', () => {
    render(<EstadoInsignia dominio="poliza" estado="EN_MORA" className="ml-2" />);

    expect(screen.getByText('En mora')).toHaveClass('ml-2', 'bg-estado-error-fondo');
  });
});
