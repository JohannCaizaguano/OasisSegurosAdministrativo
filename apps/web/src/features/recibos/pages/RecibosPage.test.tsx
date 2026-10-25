import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recibosApi } from '../api';
import { RecibosPage } from './RecibosPage';

vi.mock('../api', () => ({ recibosApi: { listar: vi.fn() } }));

afterEach(cleanup);

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
});
