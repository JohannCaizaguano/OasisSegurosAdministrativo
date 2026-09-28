import type { Pago } from '@oasis/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfirmarPagoDialog } from './ConfirmarPagoDialog';

const PAGO: Pago = {
  id: '7c1e5a90-2b3d-4f6a-9e8c-1d2b3a4c5d6e',
  polizaId: '3f2a1c8e-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
  numeroPoliza: 'POL-0001',
  monto: '120.50',
  fechaPago: '2026-09-01',
  metodo: 'TRANSFERENCIA',
  referencia: 'TRX-9',
  estado: 'REGISTRADO',
  validadoPorId: null,
  validadoEn: null,
  nota: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

afterEach(cleanup);

function montar(accion: 'validar' | 'rechazar') {
  const alConfirmar = vi.fn();
  render(
    <ConfirmarPagoDialog
      pago={PAGO}
      accion={accion}
      abierto
      enCurso={false}
      alCambiarAbierto={vi.fn()}
      alConfirmar={alConfirmar}
    />,
  );
  return { alConfirmar, casilla: () => screen.getByLabelText(/confirmo que revisé/i) };
}

describe('ConfirmarPagoDialog', () => {
  it('no confirma al enviar sin marcar la casilla', async () => {
    const { alConfirmar } = montar('validar');

    fireEvent.click(screen.getByTestId('confirmar-validar'));

    expect(await screen.findByText(/debe confirmar la validación/i)).toBeInTheDocument();
    expect(alConfirmar).not.toHaveBeenCalled();
  });

  it('exige un motivo de al menos 5 caracteres para rechazar', async () => {
    const { alConfirmar, casilla } = montar('rechazar');

    fireEvent.change(screen.getByLabelText(/motivo del rechazo/i), { target: { value: 'abc' } });
    fireEvent.click(casilla());
    fireEvent.click(screen.getByTestId('confirmar-rechazar'));

    expect(await screen.findByText(/al menos 5 caracteres/i)).toBeInTheDocument();
    expect(alConfirmar).not.toHaveBeenCalled();
  });

  it('marca el campo de motivo como inválido para el lector de pantalla', async () => {
    const { casilla } = montar('rechazar');

    fireEvent.click(casilla());
    fireEvent.click(screen.getByTestId('confirmar-rechazar'));

    await screen.findByText(/al menos 5 caracteres/i);
    expect(screen.getByLabelText(/motivo del rechazo/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('confirma la validación con la nota de auditoría', async () => {
    const { alConfirmar, casilla } = montar('validar');

    fireEvent.change(screen.getByLabelText(/nota de auditoría/i), {
      target: { value: 'depósito confirmado' },
    });
    fireEvent.click(casilla());
    fireEvent.click(screen.getByTestId('confirmar-validar'));

    await waitFor(() => expect(alConfirmar).toHaveBeenCalledWith({ nota: 'depósito confirmado' }));
  });

  it('confirma el rechazo con el motivo', async () => {
    const { alConfirmar, casilla } = montar('rechazar');

    fireEvent.change(screen.getByLabelText(/motivo del rechazo/i), {
      target: { value: 'no se encontró el depósito' },
    });
    fireEvent.click(casilla());
    fireEvent.click(screen.getByTestId('confirmar-rechazar'));

    await waitFor(() =>
      expect(alConfirmar).toHaveBeenCalledWith({ motivo: 'no se encontró el depósito' }),
    );
  });

  it('omite la nota vacía al validar', async () => {
    const { alConfirmar, casilla } = montar('validar');

    fireEvent.click(casilla());
    fireEvent.click(screen.getByTestId('confirmar-validar'));

    await waitFor(() => expect(alConfirmar).toHaveBeenCalledWith({ nota: undefined }));
  });

  it('muestra los datos del pago antes de confirmar', () => {
    montar('validar');
    expect(screen.getByText('POL-0001')).toBeInTheDocument();
    expect(screen.getByText('TRX-9')).toBeInTheDocument();
  });
});
