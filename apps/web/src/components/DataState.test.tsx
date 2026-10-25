import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AvisoVacio } from './DataState';

afterEach(cleanup);

describe('AvisoVacio', () => {
  it('pinta título, descripción y acción', () => {
    render(
      <AvisoVacio descripcion="Pruebe con otro filtro." accion={<button>Quitar filtro</button>}>
        Sin datos
      </AvisoVacio>,
    );

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('Pruebe con otro filtro.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar filtro' })).toBeInTheDocument();
  });

  it('sigue funcionando solo con el título', () => {
    render(<AvisoVacio>Sin datos</AvisoVacio>);

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });
});
