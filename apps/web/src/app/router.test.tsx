import type { Rol } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verificacionApi } from '@/features/verificacion/api';
import { useAuthStore } from '@/lib/auth-store';

import { rutas } from './router';

vi.mock('@/features/verificacion/api', () => ({ verificacionApi: { obtener: vi.fn() } }));
vi.mock('@/features/auth/api', () => ({
  authApi: { me: vi.fn().mockResolvedValue({}), logout: vi.fn().mockResolvedValue(undefined) },
}));

const CODIGO = 'RC-0123456789AB';

function entrar(rol: Rol) {
  useAuthStore.setState({
    accessToken: 't',
    autenticado: true,
    usuario: { id: 'u1', email: 'x@oasis.com', nombre: 'X', rol },
  });
}

function montar(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

beforeEach(() => {
  vi.mocked(verificacionApi.obtener).mockResolvedValue({
    codigo: CODIGO,
    estado: 'AUTENTICO',
    hashRecibo: `0x${'a'.repeat(64)}`,
    chainId: 80002,
    verificadoEn: '2026-10-20T16:00:00.000Z',
  });
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

describe('rutas de verificación (HU-28)', () => {
  it('sin sesión, la URL del QR lleva al login y, tras entrar, vuelve a ese código', async () => {
    const router = montar(`/recibos/verificar/${CODIGO}`);
    expect(router.state.location.pathname).toBe('/login');
    expect(verificacionApi.obtener).not.toHaveBeenCalled();

    act(() => entrar('CLIENTE'));

    expect(await screen.findByTestId('resultado-verificacion')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/recibos/verificar/${CODIGO}`);
    expect(verificacionApi.obtener).toHaveBeenCalledWith(CODIGO);
  });

  it.each<Rol>(['ADMIN', 'OPERADOR', 'CLIENTE'])('el %s abre la verificación', async (rol) => {
    entrar(rol);
    const router = montar(`/recibos/verificar/${CODIGO}`);
    expect(await screen.findByTestId('resultado-verificacion')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/recibos/verificar/${CODIGO}`);
  });
});
