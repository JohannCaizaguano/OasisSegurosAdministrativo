import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReciboResumen } from '@oasis/shared';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recibosApi } from '../api';
import { RecibosPage } from './RecibosPage';

vi.mock('../api', () => ({ recibosApi: { listar: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function montar() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <RecibosPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function conRecibos(...estados: ReciboResumen['estado'][]) {
  vi.mocked(recibosApi.listar).mockResolvedValue({
    data: estados.map((estado, i) => ({
      id: `9b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4${i}`,
      codigo: `RC-0123456789A${i}`,
      estado,
      idOnchain: `0x${'1'.repeat(64)}`,
      hashRecibo: `0x${'a'.repeat(64)}`,
      creadoEn: '2026-10-20T15:00:00.000Z',
    })),
    meta: { page: 1, pageSize: 50, total: estados.length, totalPages: 1 },
  });
}

describe('RecibosPage', () => {
  it('sin recibos explica y propone ir a Pagos', async () => {
    vi.mocked(recibosApi.listar).mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <RecibosPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Sin recibos todavía')).toBeInTheDocument();
    expect(screen.getByText('Cada pago validado emite un recibo.')).toBeInTheDocument();
    expect(screen.queryByText(/polygon/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a Pagos' })).toHaveAttribute('href', '/pagos');
    expect(screen.getByTestId('leyenda-estados')).toBeInTheDocument();
  });

  it('con un recibo en curso vuelve a pedir la lista a los 10 s (HU-24)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(recibosApi.listar).mockClear();
    conRecibos('ANCLADO', 'ENVIADO');
    montar();
    await screen.findByText('2 recibos');
    await act(() => vi.advanceTimersByTimeAsync(10_500));
    expect(recibosApi.listar).toHaveBeenCalledTimes(2);
  });

  it('con todos los recibos resueltos no vuelve a pedir la lista', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(recibosApi.listar).mockClear();
    conRecibos('ANCLADO', 'FALLIDO', 'ANULADO');
    montar();
    await screen.findByText('3 recibos');
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(recibosApi.listar).toHaveBeenCalledTimes(1);
  });
});
