import type { Cliente, RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { formatearFecha } from '@/lib/format';

import { ClientesPage } from './ClientesPage';
import { clientesApi } from '../api';

vi.mock('../api', () => ({
  clientesApi: { listar: vi.fn(), crear: vi.fn() },
}));

const listar = vi.mocked(clientesApi.listar);
const crear = vi.mocked(clientesApi.crear);

const CLIENTE: Cliente = {
  id: '33333333-3333-3333-3333-333333333333',
  tipoIdentificacion: 'CEDULA',
  identificacion: '1710034065',
  nombres: 'Ana',
  apellidos: 'Pérez',
  email: 'ana@example.com',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
};

function respuesta(items: Cliente[]): RespuestaPaginada<Cliente> {
  return {
    data: items,
    meta: { page: 1, pageSize: 50, total: items.length, totalPages: 1 },
  };
}

function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <ClientesPage />
    </QueryClientProvider>,
  );
}

function llenarCliente(identificacion: string) {
  fireEvent.change(screen.getByLabelText('Identificación'), {
    target: { value: identificacion },
  });
  fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Pérez' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'ana@example.com' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  listar.mockResolvedValue(respuesta([CLIENTE]));
});

afterEach(cleanup);

describe('ClientesPage', () => {
  it('muestra la fecha de registro', async () => {
    montar();

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Registrado')).toBeInTheDocument();
    expect(screen.getByText(formatearFecha(CLIENTE.createdAt))).toBeInTheDocument();
  });

  it('muestra identificación duplicada en el campo', async () => {
    listar.mockResolvedValue(respuesta([]));
    crear.mockRejectedValue(
      new ApiError(
        {
          statusCode: 409,
          code: 'CONFLICTO',
          message: 'Ya existe un cliente con esa identificación',
          details: { campo: 'identificacion', motivo: 'IDENTIFICACION_DUPLICADA' },
        },
        409,
      ),
    );
    montar();

    fireEvent.click(screen.getByTestId('boton-nuevo-cliente'));
    llenarCliente('1710034065');
    fireEvent.click(screen.getByTestId('boton-guardar-cliente'));

    expect(
      await screen.findByText('Ya existe un cliente con esa identificación'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Identificación')).toHaveAttribute('aria-invalid', 'true');
  });
});
