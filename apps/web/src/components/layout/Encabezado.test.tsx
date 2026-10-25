import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/components/ui/button';

import { Encabezado } from './Encabezado';

describe('Encabezado de página', () => {
  it('muestra el título como h1 y la frase de contexto', () => {
    render(<Encabezado titulo="Pagos" descripcion="Valide los pagos registrados." />);

    expect(screen.getByRole('heading', { level: 1, name: 'Pagos' })).toBeInTheDocument();
    expect(screen.getByText('Valide los pagos registrados.')).toBeInTheDocument();
  });

  it('coloca las acciones dentro del encabezado', () => {
    render(
      <Encabezado titulo="Clientes">
        <Button>Nuevo cliente</Button>
      </Encabezado>,
    );

    const encabezado = screen
      .getByRole('heading', { level: 1, name: 'Clientes' })
      .closest('header');
    expect(encabezado).toContainElement(screen.getByRole('button', { name: 'Nuevo cliente' }));
  });

  it('sin frase ni acciones solo muestra el título', () => {
    const { container } = render(<Encabezado titulo="Bitácora" />);

    expect(container.querySelectorAll('p')).toHaveLength(0);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
