import type { Cuota, Pago } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { polizasApi } from '@/features/polizas/api';

import { ValidarPagoDialog } from './ValidarPagoDialog';

vi.mock('@/features/polizas/api', () => ({ polizasApi: { cuotas: vi.fn() } }));

function cuota(numero: number): Cuota {
  return {
    id: `c${numero}`,
    numero,
    valor: '120.00',
    valorPagado: '0.00',
    fechaVencimiento: `2099-0${numero}-01`,
    estado: 'PENDIENTE',
    aplicaciones: [],
  };
}

beforeEach(() => {
  vi.mocked(polizasApi.cuotas).mockResolvedValue([cuota(1), cuota(2)]);
});

const PAGO: Pago = {
  id: '7c1e5a90-2b3d-4f6a-9e8c-1d2b3a4c5d6e',
  polizaId: '3f2a1c8e-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
  numeroPoliza: 'POL-0001',
  monto: '120.50',
  fechaPago: '2026-09-01',
  metodo: 'DEBITO_BANCARIO',
  referencia: 'TRX-9',
  estado: 'REGISTRADO',
  validadoPorId: null,
  validadoEn: null,
  nota: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

afterEach(cleanup);

function montar(pago: Pago = PAGO) {
  const alConfirmar = vi.fn();
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ValidarPagoDialog
        pago={pago}
        abierto
        enCurso={false}
        alCambiarAbierto={vi.fn()}
        alConfirmar={alConfirmar}
      />
    </QueryClientProvider>,
  );
  return { alConfirmar, casilla: () => screen.getByLabelText(/confirmo que revisé/i) };
}

describe('ValidarPagoDialog — vista previa de las cuotas (D24)', () => {
  it('$160 sobre cuotas de $120 y $120 anticipa la cuota Pagada y la parcial', async () => {
    montar({ ...PAGO, monto: '160.00' });

    expect(
      await screen.findByText(
        'Al validar: la cuota 1 queda Pagada y la cuota 2 recibe $40,00 (Pago parcial).',
      ),
    ).toHaveAttribute('role', 'status');
    expect(polizasApi.cuotas).toHaveBeenCalledWith(PAGO.polizaId);
  });

  it('un monto mayor que lo pendiente avisa el saldo y no deja confirmar', async () => {
    const { alConfirmar, casilla } = montar({ ...PAGO, monto: '300.00' });

    expect(await screen.findByText(/Supera el saldo pendiente \(\$240,00\)/)).toBeInTheDocument();
    fireEvent.click(casilla());
    expect(screen.getByTestId('confirmar-validar')).toBeDisabled();
    expect(alConfirmar).not.toHaveBeenCalled();
  });
});

describe('ValidarPagoDialog (HU-18, D10)', () => {
  it('explica en lenguaje llano qué ocurre al validar', () => {
    montar();

    expect(
      screen.getByText(
        'Se emitirá el recibo y se registrará para que cualquiera pueda verificarlo. El cliente lo verá en su portal. La acción no se puede deshacer.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/worker|polygon/i)).not.toBeInTheDocument();
  });

  it('no confirma al enviar sin marcar la casilla', async () => {
    const { alConfirmar } = montar();

    fireEvent.click(screen.getByTestId('confirmar-validar'));

    expect(await screen.findByText(/debe confirmar la validación/i)).toBeInTheDocument();
    expect(alConfirmar).not.toHaveBeenCalled();
  });

  it('confirma la validación con la nota de auditoría', async () => {
    const { alConfirmar, casilla } = montar();

    fireEvent.change(screen.getByLabelText(/nota de auditoría/i), {
      target: { value: 'depósito confirmado' },
    });
    fireEvent.click(casilla());
    fireEvent.click(screen.getByTestId('confirmar-validar'));

    await waitFor(() => expect(alConfirmar).toHaveBeenCalledWith({ nota: 'depósito confirmado' }));
  });

  it('omite la nota vacía al validar', async () => {
    const { alConfirmar, casilla } = montar();

    fireEvent.click(casilla());
    fireEvent.click(screen.getByTestId('confirmar-validar'));

    await waitFor(() => expect(alConfirmar).toHaveBeenCalledWith({ nota: undefined }));
  });

  it('muestra el resumen del pago, con su método, antes de confirmar', () => {
    montar();
    expect(screen.getByText('POL-0001')).toBeInTheDocument();
    expect(screen.getByText('TRX-9')).toBeInTheDocument();
    expect(screen.getByText('Débito bancario')).toBeInTheDocument();
  });

  it('la acción dorada dice «Validar y emitir recibo»', () => {
    montar();
    expect(screen.getByTestId('confirmar-validar')).toHaveTextContent('Validar y emitir recibo');
  });
});
