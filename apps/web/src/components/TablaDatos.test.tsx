import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Paginacion, TablaDatos } from './TablaDatos';

afterEach(cleanup);

function montarTabla(parcial: Partial<Parameters<typeof TablaDatos>[0]> = {}) {
  return render(
    <TablaDatos
      titulo="Clientes"
      cargando={false}
      error={null}
      alReintentar={vi.fn()}
      vacio="Sin clientes registrados"
      hayDatos
      {...parcial}
    >
      <table>
        <tbody>
          <tr>
            <td>Fila</td>
          </tr>
        </tbody>
      </table>
    </TablaDatos>,
  );
}

describe('TablaDatos', () => {
  it('muestra el esqueleto mientras carga', () => {
    montarTabla({ cargando: true });

    expect(screen.queryByText('Fila')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('muestra el aviso vacío', () => {
    montarTabla({ hayDatos: false });

    expect(screen.getByText('Sin clientes registrados')).toBeInTheDocument();
    expect(screen.queryByText('Fila')).not.toBeInTheDocument();
  });

  it('muestra el error con su reintento', () => {
    montarTabla({ error: new Error('No fue posible cargar los datos') });

    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar los datos');
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
  });

  it('muestra las filas cuando hay datos', () => {
    montarTabla();

    expect(screen.getByText('Fila')).toBeInTheDocument();
  });
});

describe('Paginacion', () => {
  it('deshabilita Anterior en la primera página', () => {
    render(<Paginacion pagina={1} totalPaginas={3} alCambiar={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeEnabled();
  });

  it('deshabilita Siguiente en la última página', () => {
    render(<Paginacion pagina={3} totalPaginas={3} alCambiar={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('muestra la página actual y navega', () => {
    const alCambiar = vi.fn();
    render(<Paginacion pagina={2} totalPaginas={5} alCambiar={alCambiar} />);

    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Página siguiente' }).click();
    expect(alCambiar).toHaveBeenCalledWith(3);
  });
});
