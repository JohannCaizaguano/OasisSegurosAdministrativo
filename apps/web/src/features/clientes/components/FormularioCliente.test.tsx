import type { Cliente } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FormularioCliente } from './FormularioCliente';
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

const crear = vi.mocked(clientesApi.crear);
const actualizar = vi.mocked(clientesApi.actualizar);

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

function montar(cliente?: Cliente) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FormularioCliente cliente={cliente} alGuardar={vi.fn()} />
    </QueryClientProvider>,
  );
}

function llenarPersona(identificacion: string) {
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
});

afterEach(cleanup);

describe('FormularioCliente', () => {
  it('muestra el error de cédula inválida', async () => {
    montar();
    llenarPersona('1712345678');

    fireEvent.click(screen.getByTestId('boton-guardar-cliente'));

    expect(await screen.findByText('Dígito verificador de la cédula inválido')).toBeInTheDocument();
    expect(screen.getByLabelText('Identificación')).toHaveAttribute('aria-invalid', 'true');
    expect(crear).not.toHaveBeenCalled();
  });

  it('cambia los campos de nombre al elegir RUC', async () => {
    montar();

    const tipo = screen.getByLabelText('Tipo de identificación');
    fireEvent.pointerDown(tipo, { button: 0, ctrlKey: false });
    fireEvent.click(tipo);
    fireEvent.click(await screen.findByRole('option', { name: 'RUC' }));

    expect(screen.getByLabelText('Razón social')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombres')).not.toBeInTheDocument();
    expect(screen.getByText('13 dígitos terminados en 001')).toBeInTheDocument();
  });

  it('marca los obligatorios vacíos', async () => {
    montar();

    fireEvent.click(screen.getByTestId('boton-guardar-cliente'));

    expect(await screen.findByText('Los nombres son obligatorios')).toBeInTheDocument();
    expect(screen.getByText('Los apellidos son obligatorios')).toBeInTheDocument();
    expect(screen.getByText('Correo electrónico inválido')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombres')).toHaveAttribute('aria-invalid', 'true');
    expect(crear).not.toHaveBeenCalled();
  });

  it('crea el cliente con la identificación normalizada', async () => {
    crear.mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
      tipoIdentificacion: 'PASAPORTE',
      identificacion: 'AB123',
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.com',
      activo: true,
      tienePolizas: false,
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z',
    });
    montar();

    const tipo = screen.getByLabelText('Tipo de identificación');
    fireEvent.pointerDown(tipo, { button: 0, ctrlKey: false });
    fireEvent.click(tipo);
    fireEvent.click(await screen.findByRole('option', { name: 'Pasaporte' }));

    llenarPersona(' ab123 ');
    fireEvent.click(screen.getByTestId('boton-guardar-cliente'));

    await waitFor(() =>
      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ tipoIdentificacion: 'PASAPORTE', identificacion: 'AB123' }),
      ),
    );
  });

  it('con pólizas deshabilita tipo e identificación y explica por qué', () => {
    montar({ ...CLIENTE, tienePolizas: true });

    const identificacion = screen.getByLabelText('Identificación');
    expect(identificacion).toBeDisabled();
    expect(screen.getByLabelText('Tipo de identificación')).toBeDisabled();
    expect(identificacion).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('identificacion-ayuda'),
    );
    expect(screen.getByText('No se puede modificar: el cliente tiene pólizas')).toBeInTheDocument();
  });

  it('sin pólizas permite cambiar la identificación al editar', () => {
    montar(CLIENTE);

    expect(screen.getByLabelText('Identificación')).not.toBeDisabled();
    expect(
      screen.queryByText('No se puede modificar: el cliente tiene pólizas'),
    ).not.toBeInTheDocument();
  });

  it('con pólizas puede guardar sin enviar la identificación bloqueada', async () => {
    actualizar.mockResolvedValue({ ...CLIENTE, tienePolizas: true });
    montar({ ...CLIENTE, tienePolizas: true });

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'ana.nueva@example.com' },
    });
    fireEvent.click(screen.getByTestId('boton-guardar-cliente'));

    await waitFor(() =>
      expect(actualizar).toHaveBeenCalledWith(
        CLIENTE.id,
        expect.objectContaining({ email: 'ana.nueva@example.com' }),
      ),
    );
    expect(actualizar).toHaveBeenCalledWith(
      CLIENTE.id,
      expect.not.objectContaining({ identificacion: expect.anything() }),
    );
  });

  it('en edición guarda los cambios contra el endpoint de actualizar', async () => {
    actualizar.mockResolvedValue({ ...CLIENTE, nombres: 'Ana María' });
    montar(CLIENTE);

    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana María' } });
    fireEvent.click(screen.getByTestId('boton-guardar-cliente'));

    await waitFor(() =>
      expect(actualizar).toHaveBeenCalledWith(
        CLIENTE.id,
        expect.objectContaining({ nombres: 'Ana María', identificacion: '1710034065' }),
      ),
    );
  });
});
