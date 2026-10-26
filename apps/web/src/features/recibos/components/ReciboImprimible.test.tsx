import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RECIBO_IMPRIMIBLE } from '../test-datos';
import { ReciboImprimible } from './ReciboImprimible';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, title }: { value: string; title?: string }) => (
    <svg data-testid="qr" data-valor={value} aria-label={title} />
  ),
}));

afterEach(cleanup);

describe('ReciboImprimible (HU-25)', () => {
  it('muestra póliza, monto, fecha, código y estado de anclaje', () => {
    render(<ReciboImprimible recibo={RECIBO_IMPRIMIBLE} />);
    expect(screen.getByRole('heading', { name: 'Recibo de pago' })).toBeInTheDocument();
    expect(screen.getByText('POL-0001')).toBeInTheDocument();
    expect(screen.getByText('$1.234,50')).toBeInTheDocument();
    expect(screen.getByText('19/10/2026')).toBeInTheDocument();
    expect(screen.getAllByText('RC-0123456789AB').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Verificable')).toHaveAttribute('data-estado', 'ANCLADO');
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('******4065')).toBeInTheDocument();
  });

  it('el QR codifica la URL de verificación con el código debajo', () => {
    render(<ReciboImprimible recibo={RECIBO_IMPRIMIBLE} />);
    expect(screen.getByTestId('qr')).toHaveAttribute(
      'data-valor',
      `${window.location.origin}/recibos/verificar/RC-0123456789AB`,
    );
    expect(
      screen.getByText('Verifique este recibo en Oasis Seguros con su sesión'),
    ).toBeInTheDocument();
  });

  it('no muestra la sal, el payload ni hashes', () => {
    render(<ReciboImprimible recibo={RECIBO_IMPRIMIBLE} />);
    expect(document.body.textContent).not.toMatch(/\bsal\b|payload|hash|0x[0-9a-f]{8}/i);
  });
});
