import type { Cliente, RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SelectorCliente } from './SelectorCliente';
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

function respuesta(items: Cliente[]): RespuestaPaginada<Cliente> {
  return {
    data: items,
    meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
  };
}

function montar() {
  const onChange = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <label htmlFor="cliente-test">Cliente</label>
      <SelectorCliente id="cliente-test" value={undefined} onChange={onChange} />
    </QueryClientProvider>,
  );
  return onChange;
}

/** Escribe una consulta y espera a que el debounce llegue al servidor. */
async function escribir(texto: string) {
  const entrada = screen.getByRole('combobox', { name: 'Cliente' });
  fireEvent.focus(entrada);
  fireEvent.change(entrada, { target: { value: texto } });
  await waitFor(() => expect(listar).toHaveBeenCalled(), { timeout: 2000 });
  return entrada;
}

beforeEach(() => {
  vi.clearAllMocks();
  listar.mockResolvedValue(respuesta([CLIENTE]));
});

afterEach(cleanup);

describe('SelectorCliente', () => {
  it('busca en el servidor solo clientes activos tras el debounce', async () => {
    montar();
    await escribir('ana');

    await waitFor(
      () =>
        expect(listar).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'ana', estado: 'ACTIVOS', pageSize: 20 }),
        ),
      { timeout: 2000 },
    );
  });

  it('con las flechas y Enter elige la opción resaltada y cierra la lista', async () => {
    const onChange = montar();
    const entrada = await escribir('ana');
    await screen.findByRole('option', { name: /Ana Pérez/ });

    fireEvent.keyDown(entrada, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: /Ana Pérez/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(entrada).toHaveAttribute('aria-activedescendant');

    fireEvent.keyDown(entrada, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(CLIENTE.id);
    expect(entrada).toHaveValue('Ana Pérez');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Escape cierra la lista sin elegir', async () => {
    const onChange = montar();
    const entrada = await escribir('ana');
    await screen.findByRole('option', { name: /Ana Pérez/ });

    fireEvent.keyDown(entrada, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sin coincidencias muestra "Sin resultados"', async () => {
    listar.mockResolvedValue(respuesta([]));
    montar();
    await escribir('zzz');

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
  });

  it('con la consulta en error no muestra "Sin resultados" y permite reintentar', async () => {
    listar.mockRejectedValue(new Error('falló la red'));
    montar();
    const entrada = screen.getByRole('combobox', { name: 'Cliente' });
    fireEvent.focus(entrada);
    fireEvent.change(entrada, { target: { value: 'ana' } });

    expect(await screen.findByText('No se pudieron cargar los clientes.')).toBeInTheDocument();
    expect(screen.queryByText('Sin resultados')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('al hacer clic en una opción la elige y permite limpiarla', async () => {
    const onChange = montar();
    await escribir('ana');
    fireEvent.click(await screen.findByRole('option', { name: /Ana Pérez/ }));

    expect(onChange).toHaveBeenCalledWith(CLIENTE.id);
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveValue('Ana Pérez');

    fireEvent.click(screen.getByRole('button', { name: 'Quitar cliente seleccionado' }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveValue('');
  });

  it('con una selección hecha, la flecha abajo no abre una lista vacía', async () => {
    montar();
    await escribir('ana');
    fireEvent.click(await screen.findByRole('option', { name: /Ana Pérez/ }));

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Cliente' }), { key: 'ArrowDown' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
