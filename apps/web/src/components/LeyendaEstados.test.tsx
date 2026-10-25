import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LeyendaEstados } from './LeyendaEstados';
import { ESTADOS } from './estados';

afterEach(cleanup);

describe('LeyendaEstados', () => {
  it('lista los tres estados del pago con su descripción', () => {
    render(<LeyendaEstados dominio="pago" />);

    const leyenda = screen.getByTestId('leyenda-estados');
    for (const estado of ['REGISTRADO', 'VALIDADO', 'RECHAZADO'] as const) {
      expect(leyenda.querySelector(`[data-estado="${estado}"]`)).not.toBeNull();
      expect(leyenda).toHaveTextContent(ESTADOS.pago[estado].descripcion);
    }
  });

  it('es un details nativo con resumen: se abre con teclado sin scripts', () => {
    render(<LeyendaEstados dominio="pago" />);

    const detalles = screen.getByTestId('leyenda-estados');
    const resumen = screen.getByText('¿Qué significa cada estado?');
    expect(detalles.tagName).toBe('DETAILS');
    expect(detalles).not.toHaveAttribute('open');
    expect(resumen.tagName).toBe('SUMMARY');
    resumen.click();
    expect(detalles).toHaveAttribute('open');
  });

  it('no repite estados que comparten texto', () => {
    render(<LeyendaEstados dominio="recibo" />);

    expect(screen.getAllByText('En proceso')).toHaveLength(1);
  });

  it('describe los estados de la póliza y deja la cuota VENCIDA con su texto', () => {
    render(<LeyendaEstados dominio="poliza" />);

    const leyenda = screen.getByTestId('leyenda-estados');
    expect(leyenda).toHaveTextContent('La póliza está activa y admite pagos.');
    expect(leyenda).toHaveTextContent('Terminó su vigencia; ya no admite pagos.');
    expect(leyenda).toHaveTextContent('Se canceló antes de terminar; ya no admite pagos.');
    expect(leyenda).toHaveTextContent('Tiene al menos una cuota vencida sin pagar.');
    expect(ESTADOS.cuota.VENCIDA.descripcion).toBe('Pasó su fecha de vencimiento sin cubrirse.');
  });
});
