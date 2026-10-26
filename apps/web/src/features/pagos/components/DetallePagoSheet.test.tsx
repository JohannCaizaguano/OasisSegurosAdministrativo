import type { PagoDetalle } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { pagosApi } from '../api';
import { DetallePagoSheet } from './DetallePagoSheet';

vi.mock('../api', () => ({ pagosApi: { obtener: vi.fn() } }));

const PAGO: PagoDetalle = {
  id: '7c1e5a90-2b3d-4f6a-9e8c-1d2b3a4c5d6e',
  polizaId: '3f2a1c8e-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
  numeroPoliza: 'POL-0001',
  monto: '120.50',
  fechaPago: '2026-10-20',
  metodo: 'DEBITO_BANCARIO',
  referencia: 'DB-0009',
  estado: 'REGISTRADO',
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
  aplicaciones: [],
  recibo: null,
};

afterEach(cleanup);

describe('DetallePagoSheet (HU-36)', () => {
  it('un pago por validar explica que aún no se aplica y no ofrece recibo', async () => {
    vi.mocked(pagosApi.obtener).mockResolvedValue(PAGO);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <DetallePagoSheet pagoId={PAGO.id} alCerrar={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText('Se aplicará a las cuotas pendientes cuando se valide.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Detalle del pago' })).toHaveTextContent('$120,50');
    expect(screen.queryByRole('heading', { name: 'Recibo' })).not.toBeInTheDocument();
  });

  it('cerrado no pide el pago', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <DetallePagoSheet pagoId={null} alCerrar={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(pagosApi.obtener).not.toHaveBeenCalled();
  });
});
