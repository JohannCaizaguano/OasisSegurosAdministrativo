import type { RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dashboardApi } from '../api';
import { PanelPersonal } from './PanelPersonal';

vi.mock('../api', () => ({
  dashboardApi: { porValidar: vi.fn(), resumenPagos: vi.fn(), resumenRecibos: vi.fn() },
}));

function paginada<T>(items: T[]): RespuestaPaginada<T> {
  return { data: items, meta: { page: 1, pageSize: 5, total: items.length, totalPages: 1 } };
}

function montar() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <PanelPersonal />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(dashboardApi.porValidar).mockResolvedValue(paginada([]));
  vi.mocked(dashboardApi.resumenPagos).mockResolvedValue(paginada([]));
  vi.mocked(dashboardApi.resumenRecibos).mockResolvedValue(paginada([]));
});

afterEach(cleanup);

describe('PanelPersonal', () => {
  it('«Revisar los pagos» abre Pagos ya filtrado por REGISTRADO', async () => {
    montar();

    expect(await screen.findByRole('link', { name: 'Revisar los pagos' })).toHaveAttribute(
      'href',
      '/pagos?estado=REGISTRADO',
    );
  });

  it('sin recibos muestra «Sin recibos todavía» con enlace a Pagos', async () => {
    montar();

    expect(await screen.findByText('Sin recibos todavía')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a Pagos' })).toHaveAttribute('href', '/pagos');
  });
});
