import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FormularioCliente } from './FormularioCliente';
import { clientesApi } from '../api';

vi.mock('../api', () => ({
  clientesApi: { listar: vi.fn(), crear: vi.fn() },
}));

const crear = vi.mocked(clientesApi.crear);

function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={cliente}>
      <FormularioCliente alGuardar={vi.fn()} />
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
});
