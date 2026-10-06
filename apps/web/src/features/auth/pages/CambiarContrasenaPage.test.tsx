import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ApiError } from '@/lib/api-client';

import { authApi } from '../api';
import { CambiarContrasenaPage } from './CambiarContrasenaPage';

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

const cambiarContrasena = vi.mocked(authApi.cambiarContrasena);

function montar() {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={['/cuenta/contrasena']}>
        <Routes>
          <Route path="/cuenta/contrasena" element={<CambiarContrasenaPage />} />
          <Route path="/" element={<div>Inicio</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function llenar(actual: string, nueva: string, confirmacion: string) {
  fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: actual } });
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: nueva } });
  fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), {
    target: { value: confirmacion },
  });
  fireEvent.click(screen.getByTestId('boton-cambiar-contrasena'));
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('CambiarContrasenaPage', () => {
  it('valida la longitud y la confirmación antes de enviar', async () => {
    montar();

    llenar('Actual.123', 'corta', 'otra-distinta');

    expect(
      await screen.findByText('La contraseña debe tener al menos 8 caracteres'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('La confirmación no coincide con la nueva contraseña'),
    ).toBeInTheDocument();
    expect(cambiarContrasena).not.toHaveBeenCalled();
  });

  it('muestra el error de la contraseña actual en su campo', async () => {
    cambiarContrasena.mockRejectedValue(
      new ApiError(
        {
          statusCode: 400,
          code: 'VALIDACION',
          message: 'La contraseña actual no es correcta',
          details: [{ path: ['actual'], message: 'La contraseña actual no es correcta' }],
        },
        400,
      ),
    );
    montar();

    llenar('Incorrecta.1', 'Nueva.Clave1', 'Nueva.Clave1');

    expect(await screen.findByText('La contraseña actual no es correcta')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña actual')).toHaveAttribute('aria-invalid', 'true');
  });

  it('al cambiarla avisa y vuelve al inicio', async () => {
    cambiarContrasena.mockResolvedValue(undefined);
    montar();

    llenar('Actual.123', 'Nueva.Clave1', 'Nueva.Clave1');

    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument();
    });
    expect(cambiarContrasena).toHaveBeenCalledWith({
      actual: 'Actual.123',
      nueva: 'Nueva.Clave1',
    });
  });
});
