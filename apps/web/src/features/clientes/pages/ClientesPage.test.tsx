import type { Cliente, RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { formatearFecha } from '@/lib/format';

import { ClientesPage } from './ClientesPage';
import { clientesApi } from '../api';

vi.mock('../api', () => ({
  clientesApi: {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    desactivar: vi.fn(),
    reactivar: vi.fn(),
  },
}));

const listar = vi.mocked(clientesApi.listar);
const crear = vi.mocked(clientesApi.crear);
const actualizar = vi.mocked(clientesApi.actualizar);
const desactivar = vi.mocked(clientesApi.desactivar);

const CLIENTE: Cliente = {
  id: '33333333-3333-3333-3333-333333333333',
  tipoIdentificacion: 'CEDULA',
  identificacion: '1710034065',
  nombres: 'Ana',
  apellidos: 'Pérez',
  email: 'ana@example.com',
  activo: true,
  tienePolizas: false,
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
};

function respuesta(
  items: Cliente[],
  meta: Partial<RespuestaPaginada<Cliente>['meta']> = {},
): RespuestaPaginada<Cliente> {
  return {
    data: items,
    meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1, ...meta },
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

function abrirMenuCliente(cliente: Cliente) {
  const boton = screen.getByTestId(`menu-cliente-${cliente.id}`);
  fireEvent.pointerDown(boton, { button: 0 });
  fireEvent.click(boton);
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

  it('consulta con el estado Activos por defecto y lo cambia filtrando', async () => {
    montar();
    await screen.findByText('Ana Pérez');

    expect(listar).toHaveBeenCalledWith(expect.objectContaining({ estado: 'ACTIVOS', page: 1 }));

    const selectEstado = screen.getByLabelText('Estado');
    fireEvent.pointerDown(selectEstado, { button: 0, ctrlKey: false });
    fireEvent.click(selectEstado);
    fireEvent.click(await screen.findByRole('option', { name: 'Inactivos' }));

    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ estado: 'INACTIVOS', page: 1 }),
      ),
    );
  });

  it('la búsqueda con debounce envía q y vuelve a la página 1', async () => {
    listar.mockResolvedValue(respuesta([CLIENTE], { total: 45, totalPages: 3 }));
    montar();
    await screen.findByText('Ana Pérez');

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    );

    fireEvent.change(screen.getByLabelText('Buscar clientes'), { target: { value: 'ana' } });

    await waitFor(
      () => expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, q: 'ana' })),
      { timeout: 2000 },
    );
  });

  it('desactivar pide confirmación y llama al endpoint', async () => {
    desactivar.mockResolvedValue({ ...CLIENTE, activo: false });
    montar();
    await screen.findByText('Ana Pérez');

    abrirMenuCliente(CLIENTE);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Desactivar' }));

    const dialogo = await screen.findByRole('alertdialog');
    expect(within(dialogo).getByText('Desactivar cliente')).toBeInTheDocument();
    expect(
      within(dialogo).getByText(/su historial de pólizas y pagos se conserva/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirmar-accion-cliente'));

    await waitFor(() => expect(desactivar).toHaveBeenCalledWith(CLIENTE.id));
  });

  it('muestra el 422 de identificación con pólizas en su campo', async () => {
    actualizar.mockRejectedValue(
      new ApiError(
        {
          statusCode: 422,
          code: 'REGLA_NEGOCIO',
          message: 'La identificación no se puede modificar porque el cliente tiene pólizas',
          details: { campo: 'identificacion', motivo: 'IDENTIFICACION_CON_POLIZAS' },
        },
        422,
      ),
    );
    montar();
    await screen.findByText('Ana Pérez');

    abrirMenuCliente(CLIENTE);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }));

    const identificacion = screen.getByLabelText('Identificación');
    fireEvent.change(identificacion, { target: { value: '3010034068' } });
    fireEvent.click(screen.getByTestId('boton-guardar-cliente'));

    expect(
      await screen.findByText(
        'La identificación no se puede modificar porque el cliente tiene pólizas',
      ),
    ).toBeInTheDocument();
    expect(identificacion).toHaveAttribute('aria-invalid', 'true');
  });
});
