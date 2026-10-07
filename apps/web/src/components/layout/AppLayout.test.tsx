import type { UsuarioSesion } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useAuthStore } from '@/lib/auth-store';

import { AppLayout } from './AppLayout';

function usuario(rol: UsuarioSesion['rol']): UsuarioSesion {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    email: `${rol.toLowerCase()}@oasis.com`,
    rol,
    nombre: `Usuario ${rol}`,
    clienteId: rol === 'CLIENTE' ? '22222222-2222-2222-2222-222222222222' : null,
  };
}

function montar(rol: UsuarioSesion['rol']) {
  useAuthStore.setState({ accessToken: 'token', usuario: usuario(rol), autenticado: true });
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Contenido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function navegacion() {
  return within(screen.getByRole('navigation', { name: 'Navegación principal' }));
}

afterEach(() => {
  cleanup();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

describe('AppLayout — menú por rol', () => {
  it('el ADMIN ve Bitácora y Verificar recibo', () => {
    montar('ADMIN');

    expect(navegacion().getByRole('link', { name: /Bitácora/ })).toBeInTheDocument();
    expect(navegacion().getByRole('link', { name: /Verificar recibo/ })).toBeInTheDocument();
  });

  it('el OPERADOR no ve Bitácora', () => {
    montar('OPERADOR');

    expect(navegacion().queryByRole('link', { name: /Bitácora/ })).not.toBeInTheDocument();
    expect(navegacion().getByRole('link', { name: /Verificar recibo/ })).toBeInTheDocument();
  });

  it('el CLIENTE solo ve Inicio', () => {
    montar('CLIENTE');

    expect(
      navegacion()
        .getAllByRole('link')
        .map((enlace) => enlace.textContent),
    ).toEqual(['Inicio']);
  });

  it('muestra el nombre del usuario en el encabezado', () => {
    montar('ADMIN');

    expect(screen.getByTestId('menu-usuario')).toHaveTextContent('Usuario ADMIN');
  });

  it('el menú del usuario ofrece cambiar la contraseña', async () => {
    montar('ADMIN');

    fireEvent.pointerDown(screen.getByTestId('menu-usuario'), { button: 0 });
    fireEvent.click(screen.getByTestId('menu-usuario'));

    expect(await screen.findByTestId('enlace-cambiar-contrasena')).toBeInTheDocument();
  });
});
