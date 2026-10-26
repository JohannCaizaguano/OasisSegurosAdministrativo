import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TarjetaVerificacion } from './TarjetaVerificacion';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qr" data-valor={value} />,
}));

afterEach(cleanup);

describe('TarjetaVerificacion (HU-28)', () => {
  it('el QR y el enlace llevan a la verificación con sesión del código', () => {
    render(
      <MemoryRouter>
        <TarjetaVerificacion codigo="RC-0123456789AB" hashRecibo={`0x${'a'.repeat(64)}`} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('qr')).toHaveAttribute(
      'data-valor',
      `${window.location.origin}/recibos/verificar/RC-0123456789AB`,
    );
    expect(screen.getByRole('link', { name: 'Abrir verificación' })).toHaveAttribute(
      'href',
      '/recibos/verificar/RC-0123456789AB',
    );
    expect(screen.getByText(/debe iniciar sesión/)).toBeInTheDocument();
  });
});
