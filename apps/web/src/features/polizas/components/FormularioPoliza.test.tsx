import type { Aseguradora, Cliente, Poliza, Ramo } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { clientesApi } from '@/features/clientes/api';

import { FormularioPoliza } from './FormularioPoliza';
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

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const crear = vi.mocked(polizasApi.crear);
const actualizar = vi.mocked(polizasApi.actualizar);
const aseguradoras = vi.mocked(polizasApi.aseguradoras);
const ramos = vi.mocked(polizasApi.ramos);
const listarClientes = vi.mocked(clientesApi.listar);
const toastError = vi.mocked(toast.error);

const CLIENTE_ID = '33333333-3333-4333-8333-333333333333';
const ASEGURADORA_ID = '44444444-4444-4444-8444-444444444444';
const RAMO_ID = '66666666-6666-4666-8666-666666666666';

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

const POLIZA: Poliza = {
  id: '55555555-5555-4555-8555-555555555555',
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

function montar(poliza?: Poliza) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FormularioPoliza poliza={poliza} alGuardar={vi.fn()} />
    </QueryClientProvider>,
  );
}

function paginada<T>(items: T[]) {
  return {
    data: items,
    meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
  };
}

async function elegirCliente() {
  const combobox = screen.getByRole('combobox', { name: 'Cliente' });
  fireEvent.focus(combobox);
  fireEvent.change(combobox, { target: { value: 'ana' } });
  await screen.findByRole('option', { name: /Ana Pérez/ }, { timeout: 2000 });
  fireEvent.keyDown(combobox, { key: 'ArrowDown' });
  fireEvent.keyDown(combobox, { key: 'Enter' });
}

async function elegirEnSelect(etiqueta: string, opcion: string) {
  const disparador = screen.getByLabelText(etiqueta);
  fireEvent.pointerDown(disparador, { button: 0, ctrlKey: false });
  fireEvent.click(disparador);
  fireEvent.click(await screen.findByRole('option', { name: opcion }));
}

async function llenarPolizaValida() {
  fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'POL-0002' } });
  await elegirCliente();
  await elegirEnSelect('Aseguradora', 'Aseguradora del Pacífico C.A.');
  await elegirEnSelect('Ramo', 'Vehículos');
  fireEvent.change(screen.getByLabelText('Prima total'), { target: { value: '150.50' } });
  fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2026-02-01' } });
  fireEvent.change(screen.getByLabelText('Fecha de fin'), { target: { value: '2026-08-01' } });
}

beforeEach(() => {
  vi.clearAllMocks();
  aseguradoras.mockResolvedValue(paginada([ASEGURADORA]));
  ramos.mockResolvedValue([RAMO]);
  listarClientes.mockResolvedValue(paginada([CLIENTE]));
});

afterEach(cleanup);

describe('FormularioPoliza', () => {
  it('valida prima y fechas con el esquema compartido', async () => {
    montar();

    fireEvent.change(screen.getByLabelText('Número'), { target: { value: 'POL-0003' } });
    fireEvent.change(screen.getByLabelText('Prima total'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), {
      target: { value: '2026-02-01' },
    });
    fireEvent.change(screen.getByLabelText('Fecha de fin'), { target: { value: '2026-02-01' } });
    fireEvent.click(screen.getByTestId('boton-guardar-poliza'));

    expect(await screen.findByText('La prima debe ser mayor que cero')).toBeInTheDocument();
    expect(
      screen.getByText('La fecha de fin debe ser posterior a la de inicio'),
    ).toBeInTheDocument();
    expect(screen.getByText('Seleccione un cliente')).toBeInTheDocument();
    expect(screen.getByText('Seleccione una aseguradora', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Seleccione un ramo', { selector: 'p' })).toBeInTheDocument();
    expect(crear).not.toHaveBeenCalled();
  });

  it('en edición no muestra el cliente y bloquea la prima con pagos validados', () => {
    montar({ ...POLIZA, tienePagosValidados: true });

    expect(screen.queryByLabelText('Cliente')).not.toBeInTheDocument();
    const prima = screen.getByLabelText('Prima total');
    expect(prima).toBeDisabled();
    expect(prima).toHaveAttribute('aria-describedby', expect.stringContaining('prima-ayuda'));
    expect(
      screen.getByText('No se puede modificar: la póliza tiene pagos validados'),
    ).toBeInTheDocument();
  });

  it('en edición envía solo los campos editables contra actualizar', async () => {
    actualizar.mockResolvedValue(POLIZA);
    montar(POLIZA);

    fireEvent.change(screen.getByLabelText('Prima total'), { target: { value: '1600.00' } });
    fireEvent.click(screen.getByTestId('boton-guardar-poliza'));

    await waitFor(() =>
      expect(actualizar).toHaveBeenCalledWith(
        POLIZA.id,
        expect.objectContaining({ primaTotal: '1600.00' }),
      ),
    );
    expect(actualizar).toHaveBeenCalledWith(
      POLIZA.id,
      expect.not.objectContaining({ clienteId: expect.anything() }),
    );
  });

  it('muestra el 409 de número duplicado en el campo', async () => {
    crear.mockRejectedValue(
      new ApiError(
        {
          statusCode: 409,
          code: 'CONFLICTO',
          message: 'Ya existe una póliza con ese número',
          details: { campo: 'numero', motivo: 'NUMERO_DUPLICADO' },
        },
        409,
      ),
    );
    montar();

    await llenarPolizaValida();
    fireEvent.click(screen.getByTestId('boton-guardar-poliza'));

    expect(await screen.findByText('Ya existe una póliza con ese número')).toBeInTheDocument();
    expect(screen.getByLabelText('Número')).toHaveAttribute('aria-invalid', 'true');
  });

  it('muestra el 422 de cliente inactivo en su campo', async () => {
    crear.mockRejectedValue(
      new ApiError(
        {
          statusCode: 422,
          code: 'REGLA_NEGOCIO',
          message: 'El cliente está inactivo y no admite nuevas pólizas',
          details: { campo: 'clienteId', motivo: 'CLIENTE_INACTIVO' },
        },
        422,
      ),
    );
    montar();

    await llenarPolizaValida();
    fireEvent.click(screen.getByTestId('boton-guardar-poliza'));

    expect(
      await screen.findByText('El cliente está inactivo y no admite nuevas pólizas'),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('poliza-cliente-error'),
    );
  });

  it('un error de un campo que no está montado en edición cae al toast', async () => {
    actualizar.mockRejectedValue(
      new ApiError(
        {
          statusCode: 422,
          code: 'REGLA_NEGOCIO',
          message: 'El cliente está inactivo y no admite nuevas pólizas',
          details: { campo: 'clienteId', motivo: 'CLIENTE_INACTIVO' },
        },
        422,
      ),
    );
    montar(POLIZA);

    fireEvent.click(screen.getByTestId('boton-guardar-poliza'));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'El cliente está inactivo y no admite nuevas pólizas',
      ),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('un error sin campo identificado cae al toast', async () => {
    actualizar.mockRejectedValue(
      new ApiError(
        { statusCode: 500, code: 'ERROR_INTERNO', message: 'No fue posible guardar' },
        500,
      ),
    );
    montar(POLIZA);

    fireEvent.click(screen.getByTestId('boton-guardar-poliza'));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('No fue posible guardar'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
