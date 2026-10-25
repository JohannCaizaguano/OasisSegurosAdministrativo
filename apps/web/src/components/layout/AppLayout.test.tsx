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

const RUTAS = ['/', '/pagos', '/recibos', '/recibos/verificar', '/clientes', '/cuenta/contrasena'];

function montar(rol: UsuarioSesion['rol'], entrada = '/') {
  useAuthStore.setState({ accessToken: 'token', usuario: usuario(rol), autenticado: true });
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[entrada]}>
        <Routes>
          <Route element={<AppLayout />}>
            {RUTAS.map((ruta) => (
              <Route key={ruta} path={ruta} element={<p>Página {ruta}</p>} />
            ))}
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function riel() {
  return within(screen.getByRole('navigation', { name: 'Navegación principal' }));
}

function barraCliente() {
  return within(screen.getByRole('navigation', { name: 'Secciones del portal' }));
}

afterEach(() => {
  cleanup();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

describe('AppLayout — menú por rol', () => {
  it('el ADMIN ve Bitácora y Verificar recibo', () => {
    montar('ADMIN');

    expect(riel().getByRole('link', { name: /Bitácora/ })).toBeInTheDocument();
    expect(riel().getByRole('link', { name: /Verificar recibo/ })).toBeInTheDocument();
  });

  it('el OPERADOR no ve Bitácora', () => {
    montar('OPERADOR');

    expect(riel().queryByRole('link', { name: /Bitácora/ })).not.toBeInTheDocument();
    expect(riel().getByRole('link', { name: /Verificar recibo/ })).toBeInTheDocument();
  });

  it('el OPERADOR no ve ningún ítem exclusivo del ADMIN', () => {
    montar('OPERADOR');

    expect(riel().queryByRole('link', { name: /Usuarios/ })).not.toBeInTheDocument();
    expect(riel().queryByRole('link', { name: /Bitácora/ })).not.toBeInTheDocument();
    expect(
      riel()
        .getAllByRole('link')
        .map((enlace) => enlace.textContent),
    ).toEqual([
      'Inicio',
      'Pagos',
      'Recibos',
      'Verificar recibo',
      'Clientes',
      'Pólizas',
      'Aseguradoras',
    ]);
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

describe('AppLayout — riel del personal', () => {
  it('muestra el isologo con su texto alternativo', () => {
    montar('OPERADOR');

    expect(riel().getByRole('img', { name: 'Oasis Seguros' })).toBeInTheDocument();
  });

  it('marca con aria-current solo el ítem de la página abierta', () => {
    montar('OPERADOR', '/pagos');

    expect(riel().getByRole('link', { name: 'Pagos' })).toHaveAttribute('aria-current', 'page');
    expect(riel().getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('en la verificación marca «Verificar recibo» y no «Recibos»', () => {
    montar('ADMIN', '/recibos/verificar');

    expect(riel().getByRole('link', { name: 'Verificar recibo' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(riel().getByRole('link', { name: 'Recibos' })).not.toHaveAttribute('aria-current');
  });

  it('se recorre con Tab en orden: salto al contenido, ítems del riel y menú del usuario', () => {
    const { container } = montar('OPERADOR');

    const tabulables = Array.from(
      container.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex]'),
    ).filter((elemento) => elemento.tabIndex >= 0 && !elemento.hasAttribute('disabled'));

    expect(tabulables[0]).toHaveTextContent('Saltar al contenido');
    expect(tabulables[0]).toHaveAttribute('href', '#contenido');
    expect(tabulables.slice(1, 8).map((elemento) => elemento.textContent)).toEqual([
      'Inicio',
      'Pagos',
      'Recibos',
      'Verificar recibo',
      'Clientes',
      'Pólizas',
      'Aseguradoras',
    ]);
    expect(tabulables[8]).toBe(screen.getByTestId('menu-usuario'));
  });

  it('un ítem enfocado con el teclado lleva a su página', () => {
    montar('OPERADOR');

    const pagos = riel().getByRole('link', { name: 'Pagos' });
    pagos.focus();
    expect(pagos).toHaveFocus();
    fireEvent.click(pagos);

    expect(screen.getByText('Página /pagos')).toBeInTheDocument();
    expect(riel().getByRole('link', { name: 'Pagos' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('AppLayout — portal del cliente', () => {
  it('el CLIENTE ve la barra inferior y no el riel', () => {
    montar('CLIENTE');

    expect(
      screen.queryByRole('navigation', { name: 'Navegación principal' }),
    ).not.toBeInTheDocument();
    expect(
      barraCliente()
        .getAllByRole('link')
        .map((enlace) => enlace.textContent),
    ).toEqual(['Inicio', 'Pólizas', 'Recibos', 'Cuenta']);
  });

  it('las pestañas apuntan a las secciones del inicio y a la cuenta', () => {
    montar('CLIENTE');

    expect(barraCliente().getByRole('link', { name: 'Pólizas' })).toHaveAttribute(
      'href',
      '/#polizas',
    );
    expect(barraCliente().getByRole('link', { name: 'Recibos' })).toHaveAttribute(
      'href',
      '/#pagos',
    );
    expect(barraCliente().getByRole('link', { name: 'Cuenta' })).toHaveAttribute(
      'href',
      '/cuenta/contrasena',
    );
  });

  it('marca la pestaña de la sección abierta', () => {
    montar('CLIENTE', '/#polizas');

    expect(barraCliente().getByRole('link', { name: 'Pólizas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(barraCliente().getByRole('link', { name: 'Inicio' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('en la cuenta marca «Cuenta»', () => {
    montar('CLIENTE', '/cuenta/contrasena');

    expect(barraCliente().getByRole('link', { name: 'Cuenta' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('el CLIENTE conserva el menú del usuario', () => {
    montar('CLIENTE');

    expect(screen.getByTestId('menu-usuario')).toHaveTextContent('Usuario CLIENTE');
  });
});
