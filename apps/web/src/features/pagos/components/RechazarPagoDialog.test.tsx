import type { Pago } from '@oasis/shared';
import { MOTIVOS_RECHAZO_FRECUENTES } from '@oasis/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RechazarPagoDialog } from './RechazarPagoDialog';

const PAGO: Pago = {
  id: '7c1e5a90-2b3d-4f6a-9e8c-1d2b3a4c5d6e',
  polizaId: '3f2a1c8e-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
  numeroPoliza: 'POL-0001',
  monto: '120.50',
  fechaPago: '2026-09-01',
  metodo: 'DEBITO_BANCARIO',
  referencia: 'TRX-9',
  estado: 'REGISTRADO',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

afterEach(cleanup);

function montar() {
  const alConfirmar = vi.fn();
  render(
    <RechazarPagoDialog
      pago={PAGO}
      abierto
      enCurso={false}
      alCambiarAbierto={vi.fn()}
      alConfirmar={alConfirmar}
    />,
  );
  return { alConfirmar, motivo: () => screen.getByLabelText(/motivo del rechazo/i) };
}

describe('RechazarPagoDialog (HU-19, D10)', () => {
  it('resalta en negrita que el cliente verá el motivo en su portal', () => {
    montar();

    expect(screen.getByText('El cliente verá el motivo en su portal.').tagName).toBe('STRONG');
  });

  it('sin motivo no habilita «Rechazar pago»', () => {
    montar();
    expect(screen.getByTestId('confirmar-rechazar')).toBeDisabled();
  });

  it('con menos de 5 caracteres sigue deshabilitado y lo explica', () => {
    const { motivo } = montar();
    fireEvent.change(motivo(), { target: { value: 'abc' } });

    expect(screen.getByTestId('confirmar-rechazar')).toBeDisabled();
    expect(screen.getByText('3/300')).toBeInTheDocument();
    expect(screen.getByText(/entre 5 y 300 caracteres/i)).toBeInTheDocument();
  });

  it('un chip de motivo frecuente rellena el texto, queda marcado y el texto sigue editable', () => {
    const { motivo } = montar();
    const chip = screen.getByRole('button', { name: MOTIVOS_RECHAZO_FRECUENTES[2] });

    fireEvent.click(chip);

    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(motivo()).toHaveValue(MOTIVOS_RECHAZO_FRECUENTES[2]);
    fireEvent.change(motivo(), { target: { value: 'Pago duplicado con DB-0001' } });
    expect(motivo()).toHaveValue('Pago duplicado con DB-0001');
    expect(screen.getByTestId('confirmar-rechazar')).toBeEnabled();
  });

  it('ofrece los cuatro motivos frecuentes', () => {
    montar();
    for (const texto of MOTIVOS_RECHAZO_FRECUENTES) {
      expect(screen.getByRole('button', { name: texto })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('confirma el rechazo con el motivo recortado', async () => {
    const { alConfirmar, motivo } = montar();
    fireEvent.change(motivo(), { target: { value: '  no se encontró el depósito  ' } });

    fireEvent.click(screen.getByTestId('confirmar-rechazar'));

    await waitFor(() =>
      expect(alConfirmar).toHaveBeenCalledWith({ motivo: 'no se encontró el depósito' }),
    );
  });

  it('limita el motivo a 300 caracteres', () => {
    const { motivo } = montar();
    expect(motivo()).toHaveAttribute('maxLength', '300');
  });
});
