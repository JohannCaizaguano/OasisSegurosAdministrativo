import type { Aseguradora, RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

import { AseguradorasPage } from './AseguradorasPage';
import { aseguradorasApi } from '../api';

vi.mock('../api', () => ({
  aseguradorasApi: {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
  },
}));

const listar = vi.mocked(aseguradorasApi.listar);
const crear = vi.mocked(aseguradorasApi.crear);
const actualizar = vi.mocked(aseguradorasApi.actualizar);

const ASEGURADORA_ID = '44444444-4444-4444-4444-444444444444';

const ASEGURADORA: Aseguradora = {
  id: ASEGURADORA_ID,
  nombre: 'Aseguradora del Pacífico C.A.',
  ruc: '1790012345001',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
};

function respuesta(items: Aseguradora[]): RespuestaPaginada<Aseguradora> {
  return {
    data: items,
    meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
  };
}

function montar(rol: 'ADMIN' | 'OPERADOR') {
  useAuthStore.setState({
    accessToken: 'token',
    autenticado: true,
    usuario: {
      id: '11111111-1111-1111-1111-111111111111',
      email: `${rol.toLowerCase()}@oasis.com`,
      rol,
      nombre: `Usuario ${rol}`,
      clienteId: null,
    },
  });
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <AseguradorasPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listar.mockResolvedValue(respuesta([ASEGURADORA]));
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

describe('AseguradorasPage', () => {
  it('el operador ve el listado sin el botón Nueva', async () => {
    montar('OPERADOR');

    expect(await screen.findByText('Aseguradora del Pacífico C.A.')).toBeInTheDocument();
    expect(screen.queryByTestId('boton-nueva-aseguradora')).not.toBeInTheDocument();
  });

  it('el administrador edita el nombre de una aseguradora', async () => {
    actualizar.mockResolvedValue({ ...ASEGURADORA, nombre: 'Pacífico Seguros' });
    montar('ADMIN');
    await screen.findByText('Aseguradora del Pacífico C.A.');

    const boton = screen.getByTestId(`menu-aseguradora-${ASEGURADORA_ID}`);
    fireEvent.pointerDown(boton, { button: 0 });
    fireEvent.click(boton);
    fireEvent.click(await screen.findByText('Editar'));

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Pacífico Seguros' } });
    fireEvent.click(screen.getByTestId('boton-guardar-aseguradora'));

    await waitFor(() =>
      expect(actualizar).toHaveBeenCalledWith(ASEGURADORA_ID, {
        nombre: 'Pacífico Seguros',
        ruc: '1790012345001',
      }),
    );
  });

  it('muestra RUC duplicado en el campo', async () => {
    listar.mockResolvedValue(respuesta([]));
    crear.mockRejectedValue(
      new ApiError(
        {
          statusCode: 409,
          code: 'CONFLICTO',
          message: 'Ya existe una aseguradora con ese RUC',
          details: { campo: 'ruc', motivo: 'RUC_DUPLICADO' },
        },
        409,
      ),
    );
    montar('ADMIN');

    fireEvent.click(screen.getByTestId('boton-nueva-aseguradora'));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Otra Aseguradora' } });
    fireEvent.change(screen.getByLabelText('RUC'), { target: { value: '1790012345001' } });
    fireEvent.click(screen.getByTestId('boton-guardar-aseguradora'));

    expect(await screen.findByText('Ya existe una aseguradora con ese RUC')).toBeInTheDocument();
    expect(screen.getByLabelText('RUC')).toHaveAttribute('aria-invalid', 'true');
  });
});
