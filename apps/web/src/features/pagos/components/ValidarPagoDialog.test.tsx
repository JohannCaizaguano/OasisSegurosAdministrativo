import type { Pago } from '@oasis/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ValidarPagoDialog } from './ValidarPagoDialog';

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

function montar() {
  const alConfirmar = vi.fn();
  render(
    <ValidarPagoDialog
      pago={PAGO}
      abierto
      enCurso={false}
      alCambiarAbierto={vi.fn()}
      alConfirmar={alConfirmar}
    />,
  );
  return { alConfirmar, casilla: () => screen.getByLabelText(/confirmo que revisé/i) };
}

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
