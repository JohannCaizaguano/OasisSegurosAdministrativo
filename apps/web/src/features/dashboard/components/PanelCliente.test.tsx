import type { Pago, Poliza, RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dashboardApi } from '../api';
import { PanelCliente } from './PanelCliente';

vi.mock('../api', () => ({ dashboardApi: { misPolizas: vi.fn(), misPagos: vi.fn() } }));

const MOTIVO = 'La referencia no corresponde';

function paginada<T>(items: T[]): RespuestaPaginada<T> {
  return { data: items, meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } };
}

const RECHAZADO: Pago = {
  id: '7c1e5a90-2b3d-4f6a-9e8c-1d2b3a4c5d6e',
  polizaId: '3f2a1c8e-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
  numeroPoliza: 'POL-0001',
  monto: '120.50',
  fechaPago: '2026-10-20',
  metodo: 'DEBITO_BANCARIO',
  referencia: 'DB-0009',
  estado: 'RECHAZADO',
  motivoRechazo: MOTIVO,
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-21T10:00:00.000Z',
};

beforeEach(() => {
  vi.mocked(dashboardApi.misPolizas).mockResolvedValue(paginada([]));
  vi.mocked(dashboardApi.misPagos).mockResolvedValue(
    paginada([RECHAZADO, { ...RECHAZADO, id: 'otro', estado: 'VALIDADO', motivoRechazo: null }]),
  );
});

afterEach(cleanup);

describe('PanelCliente (HU-19)', () => {
  it('el cliente ve el motivo bajo su pago rechazado, y solo ahí', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PanelCliente />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const motivo = await screen.findByText(MOTIVO);
    const fila = motivo.closest('ol')?.closest('li') ?? null;
    expect(fila).not.toBeNull();
    expect((fila as HTMLElement).querySelector('[data-estado="RECHAZADO"]')).not.toBeNull();
    expect(screen.getAllByText(/Motivo del rechazo/)).toHaveLength(1);
  });

  it('una póliza en mora lo dice y lo explica', async () => {
    vi.mocked(dashboardApi.misPolizas).mockResolvedValue(
      paginada([
        {
          id: '55555555-5555-4555-8555-555555555555',
          numero: 'POL-0001',
          clienteId: '11111111-1111-4111-8111-111111111111',
          aseguradoraId: '22222222-2222-4222-8222-222222222222',
          ramoId: '33333333-3333-4333-8333-333333333333',
          ramo: 'Vida',
          ramoCodigo: 'VIDA',
          primaTotal: '100.00',
          fechaInicio: '2026-01-01',
          fechaFin: '2027-01-01',
          estado: 'VIGENTE',
          clienteNombre: 'Ana Pérez',
          aseguradoraNombre: 'Aseguradora del Pacífico C.A.',
          tienePagosValidados: false,
          enMora: true,
          createdAt: '2026-01-01T12:00:00.000Z',
          updatedAt: '2026-01-01T12:00:00.000Z',
        } satisfies Poliza,
      ]),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PanelCliente />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('En mora')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tiene una cuota vencida. Comuníquese con Oasis Seguros para ponerse al día.',
      ),
    ).toBeInTheDocument();
  });

  it('cada pago trae su seguimiento en tres pasos', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PanelCliente />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findAllByRole('list', { name: 'Seguimiento del pago' })).toHaveLength(2);
  });
});
