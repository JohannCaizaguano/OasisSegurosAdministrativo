import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

import { authApi } from '../api';
import { LoginPage } from './LoginPage';

vi.mock('../api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refrescar: vi.fn(),
    cambiarContrasena: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const login = vi.mocked(authApi.login);
const errorToast = vi.mocked(toast.error);

function montar() {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function enviarCredenciales() {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'operador@oasis.com' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'Operador.Oasis1' },
  });
  fireEvent.click(screen.getByTestId('boton-login'));
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    accessToken: null,
    usuario: null,
    autenticado: false,
    motivoCierre: null,
  });
});

afterEach(() => {
  cleanup();
});

describe('LoginPage', () => {
  it('muestra el mensaje genérico del API ante credenciales inválidas', async () => {
    login.mockRejectedValue(
      new ApiError(
        { statusCode: 401, code: 'NO_AUTORIZADO', message: 'Credenciales inválidas' },
        401,
      ),
    );
    montar();

    enviarCredenciales();

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Credenciales inválidas');
    });
  });

  it('muestra el aviso de cierre por inactividad', () => {
    useAuthStore.setState({ motivoCierre: 'inactividad' });
    montar();

    expect(screen.getByTestId('aviso-cierre')).toHaveTextContent(
      'Su sesión se cerró por inactividad.',
    );
  });

  it('muestra el aviso de cierre desde el servidor', () => {
    useAuthStore.setState({ motivoCierre: 'expirada' });
    montar();

    expect(screen.getByTestId('aviso-cierre')).toHaveTextContent(
      'Su sesión se cerró. Inicie sesión de nuevo.',
    );
  });
});
