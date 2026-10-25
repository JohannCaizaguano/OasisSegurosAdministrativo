import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CampoContrasena } from './CampoContrasena';

function montar() {
  const alEnviar = vi.fn((evento: React.FormEvent) => evento.preventDefault());
  render(
    <form onSubmit={alEnviar}>
      <label htmlFor="clave">Contraseña</label>
      <CampoContrasena id="clave" defaultValue="Secreta.123" />
    </form>,
  );
  return { alEnviar, campo: screen.getByLabelText('Contraseña') };
}

afterEach(cleanup);

describe('CampoContrasena', () => {
  it('nace oculta, con el botón «Mostrar contraseña» sin pulsar', () => {
    const { campo } = montar();

    expect(campo).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('alterna entre texto y contraseña sin enviar el formulario ni perder el valor', () => {
    const { alEnviar, campo } = montar();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(campo).toHaveAttribute('type', 'text');
    expect(campo).toHaveValue('Secreta.123');
    const ocultar = screen.getByRole('button', { name: 'Ocultar contraseña' });
    expect(ocultar).toHaveAttribute('aria-pressed', 'true');
    expect(ocultar).toHaveAttribute('type', 'button');

    fireEvent.click(ocultar);
    expect(campo).toHaveAttribute('type', 'password');
    expect(alEnviar).not.toHaveBeenCalled();
  });

  it('la etiqueta «Contraseña» sigue resolviendo a un solo elemento', () => {
    montar();

    expect(screen.getAllByLabelText(/contraseña/i)).toHaveLength(1);
  });
});
