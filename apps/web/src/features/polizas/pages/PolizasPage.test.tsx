import type { Aseguradora, Cliente, Poliza, Ramo, RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PolizasPage } from './PolizasPage';
import { clientesApi } from '@/features/clientes/api';
import { polizasApi } from '../api';

vi.mock('../api', () => ({
  polizasApi: {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    cambiarEstado: vi.fn(),
    aseguradoras: vi.fn(),
    ramos: vi.fn(),
  },
}));

vi.mock('@/features/clientes/api', () => ({
  clientesApi: { listar: vi.fn() },
}));

const listar = vi.mocked(polizasApi.listar);
const cambiarEstado = vi.mocked(polizasApi.cambiarEstado);
const aseguradoras = vi.mocked(polizasApi.aseguradoras);
const ramos = vi.mocked(polizasApi.ramos);
const listarClientes = vi.mocked(clientesApi.listar);

const CLIENTE_ID = '33333333-3333-4333-8333-333333333333';
const ASEGURADORA_ID = '44444444-4444-4444-8444-444444444444';
const RAMO_ID = '66666666-6666-4666-8666-666666666666';
const POLIZA_ID = '55555555-5555-4555-8555-555555555555';

const POLIZA: Poliza = {
  id: POLIZA_ID,
  numero: 'POL-0001',
  clienteId: CLIENTE_ID,
  aseguradoraId: ASEGURADORA_ID,
  ramoId: RAMO_ID,
  ramo: 'Vehículos',
  primaTotal: '1500.50',
  fechaInicio: '2026-01-01',
  fechaFin: '2026-12-31',
  estado: 'VIGENTE',
  clienteNombre: 'Ana Pérez',
  aseguradoraNombre: 'Aseguradora del Pacífico C.A.',
  tienePagosValidados: false,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

const CLIENTE: Cliente = {
  id: CLIENTE_ID,
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

const ASEGURADORA: Aseguradora = {
  id: ASEGURADORA_ID,
  nombre: 'Aseguradora del Pacífico C.A.',
  ruc: '1790012345001',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
};

const RAMO: Ramo = { id: RAMO_ID, codigo: 'VEHICULOS', nombre: 'Vehículos' };

function paginada<T>(items: T[], meta: Partial<RespuestaPaginada<T>['meta']> = {}) {
  return {
    data: items,
    meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1, ...meta },
  };
}

function montar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PolizasPage />
    </QueryClientProvider>,
  );
}

function abrirMenuPoliza(poliza: Poliza) {
  const boton = screen.getByTestId(`menu-poliza-${poliza.id}`);
  fireEvent.pointerDown(boton, { button: 0 });
  fireEvent.click(boton);
}

function elegirEnSelect(etiqueta: string, opcion: string) {
  const disparador = screen.getByLabelText(etiqueta);
  fireEvent.pointerDown(disparador, { button: 0, ctrlKey: false });
  fireEvent.click(disparador);
  return screen.findByRole('option', { name: opcion }).then((elemento) => {
    fireEvent.click(elemento);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  listar.mockResolvedValue(paginada([POLIZA]));
  aseguradoras.mockResolvedValue(paginada([ASEGURADORA]));
  ramos.mockResolvedValue([RAMO]);
  listarClientes.mockResolvedValue(paginada([CLIENTE]));
});

afterEach(cleanup);

describe('PolizasPage', () => {
  it('muestra el listado paginado', async () => {
    listar.mockResolvedValue(paginada([POLIZA], { total: 45, totalPages: 3 }));
    montar();

    expect(await screen.findByText('POL-0001')).toBeInTheDocument();
    expect(listar).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeEnabled();
  });

  it('el encabezado Vigencia alterna el orden con aria-sort', async () => {
    montar();
    await screen.findByText('POL-0001');

    expect(screen.getByRole('columnheader', { name: /Vigencia/ })).toHaveAttribute(
      'aria-sort',
      'none',
    );

    fireEvent.click(screen.getByRole('button', { name: /Vigencia/ }));
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ orden: 'fechaFinAsc', page: 1 }),
      ),
    );
    expect(await screen.findByRole('columnheader', { name: /Vigencia/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    fireEvent.click(screen.getByRole('button', { name: /Vigencia/ }));
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ orden: 'fechaFinDesc', page: 1 }),
      ),
    );
    expect(await screen.findByRole('columnheader', { name: /Vigencia/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('los filtros de cliente, aseguradora y estado envían sus parámetros', async () => {
    montar();
    await screen.findByText('POL-0001');

    const cliente = screen.getByRole('combobox', { name: 'Cliente' });
    fireEvent.focus(cliente);
    fireEvent.change(cliente, { target: { value: 'ana' } });
    await screen.findByRole('option', { name: /Ana Pérez/ }, { timeout: 2000 });
    fireEvent.keyDown(cliente, { key: 'ArrowDown' });
    fireEvent.keyDown(cliente, { key: 'Enter' });

    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ clienteId: CLIENTE_ID, page: 1 }),
      ),
    );

    await elegirEnSelect('Aseguradora', 'Aseguradora del Pacífico C.A.');
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ aseguradoraId: ASEGURADORA_ID }),
      ),
    );

    await elegirEnSelect('Estado', 'Vencida');
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ estado: 'VENCIDA' })),
    );
  });

  it('"Limpiar filtros" vacía el combobox y restablece los parámetros', async () => {
    montar();
    await screen.findByText('POL-0001');

    const cliente = screen.getByRole('combobox', { name: 'Cliente' });
    fireEvent.focus(cliente);
    fireEvent.change(cliente, { target: { value: 'ana' } });
    await screen.findByRole('option', { name: /Ana Pérez/ });
    fireEvent.keyDown(cliente, { key: 'ArrowDown' });
    fireEvent.keyDown(cliente, { key: 'Enter' });
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ clienteId: CLIENTE_ID, page: 1 }),
      ),
    );

    await elegirEnSelect('Estado', 'Cancelada');
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ estado: 'CANCELADA' })),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveValue('');
    await waitFor(() => {
      const ultima = listar.mock.calls.at(-1)?.[0];
      expect(ultima).toMatchObject({ page: 1, orden: 'recientes' });
      expect(ultima?.clienteId).toBeUndefined();
      expect(ultima?.estado).toBeUndefined();
    });
  });

  it('una póliza cancelada no ofrece acciones de fila', async () => {
    listar.mockResolvedValue(paginada([{ ...POLIZA, estado: 'CANCELADA' }]));
    montar();
    await screen.findByText('POL-0001');

    expect(screen.queryByTestId(`menu-poliza-${POLIZA_ID}`)).not.toBeInTheDocument();
  });

  it('el combobox de Nueva póliza nace vacío cada vez que se abre el diálogo', async () => {
    montar();
    await screen.findByText('POL-0001');

    fireEvent.click(screen.getByTestId('boton-nueva-poliza'));
    const dialogo = await screen.findByRole('dialog', { name: 'Nueva póliza' });
    const combobox = within(dialogo).getByRole('combobox', { name: 'Cliente' });
    fireEvent.focus(combobox);
    fireEvent.change(combobox, { target: { value: 'ana' } });
    await screen.findByRole('option', { name: /Ana Pérez/ });
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    fireEvent.keyDown(combobox, { key: 'Enter' });
    expect(combobox).toHaveValue('Ana Pérez');

    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cerrar' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Nueva póliza' })).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId('boton-nueva-poliza'));
    const dialogoNuevo = await screen.findByRole('dialog', { name: 'Nueva póliza' });
    expect(within(dialogoNuevo).getByRole('combobox', { name: 'Cliente' })).toHaveValue('');
  });

  it('Escape cierra la lista del combobox sin cerrar el diálogo', async () => {
    montar();
    await screen.findByText('POL-0001');

    fireEvent.click(screen.getByTestId('boton-nueva-poliza'));
    const dialogo = await screen.findByRole('dialog', { name: 'Nueva póliza' });

    const combobox = within(dialogo).getByRole('combobox', { name: 'Cliente' });
    fireEvent.focus(combobox);
    fireEvent.change(combobox, { target: { value: 'ana' } });
    await screen.findByRole('option', { name: /Ana Pérez/ });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(combobox, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Nueva póliza' })).toBeInTheDocument();
  });

  it('cancelar póliza pide confirmación y llama al endpoint', async () => {
    cambiarEstado.mockResolvedValue({ ...POLIZA, estado: 'CANCELADA' });
    montar();
    await screen.findByText('POL-0001');

    abrirMenuPoliza(POLIZA);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Cancelar póliza' }));

    const dialogo = await screen.findByRole('alertdialog');
    expect(within(dialogo).getByRole('heading', { name: 'Cancelar póliza' })).toBeInTheDocument();
    expect(within(dialogo).getByText(/definitiva/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirmar-accion-poliza'));

    await waitFor(() =>
      expect(cambiarEstado).toHaveBeenCalledWith(POLIZA.id, { estado: 'CANCELADA' }),
    );
  });
});
