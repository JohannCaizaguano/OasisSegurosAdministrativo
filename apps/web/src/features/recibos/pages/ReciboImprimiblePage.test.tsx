import type { Rol } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/lib/auth-store';

import { recibosApi } from '../api';
import { RECIBO_ID, RECIBO_IMPRIMIBLE } from '../test-datos';
import { ReciboImprimiblePage } from './ReciboImprimiblePage';

vi.mock('../api', () => ({ recibosApi: { imprimible: vi.fn(), miImprimible: vi.fn() } }));

function montar(rol: Rol, ruta: string) {
  useAuthStore.setState({
    accessToken: 't',
    autenticado: true,
    usuario: { id: 'u1', email: 'x@oasis.com', nombre: 'X', rol },
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/recibos/:id/imprimir" element={<ReciboImprimiblePage />} />
          <Route path="/portal/recibos/:id" element={<ReciboImprimiblePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(recibosApi.imprimible).mockResolvedValue(RECIBO_IMPRIMIBLE);
  vi.mocked(recibosApi.miImprimible).mockResolvedValue(RECIBO_IMPRIMIBLE);
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

describe('ReciboImprimiblePage (HU-25)', () => {
  it('el personal lee el recibo de /recibos/:id/imprimible', async () => {
    montar('OPERADOR', `/recibos/${RECIBO_ID}/imprimir`);
    expect(await screen.findByRole('heading', { name: 'Recibo de pago' })).toBeInTheDocument();
    expect(recibosApi.imprimible).toHaveBeenCalledWith(RECIBO_ID);
    expect(recibosApi.miImprimible).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Volver al recibo' })).toHaveAttribute(
      'href',
      `/recibos/${RECIBO_ID}`,
    );
  });

  it('el cliente lee su recibo de /mis-recibos/:id/imprimible', async () => {
    montar('CLIENTE', `/portal/recibos/${RECIBO_ID}`);
    expect(await screen.findByRole('heading', { name: 'Recibo de pago' })).toBeInTheDocument();
    expect(recibosApi.miImprimible).toHaveBeenCalledWith(RECIBO_ID);
    expect(recibosApi.imprimible).not.toHaveBeenCalled();
  });

  it('«Imprimir o guardar PDF» abre el diálogo de impresión del navegador', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    montar('ADMIN', `/recibos/${RECIBO_ID}/imprimir`);
    fireEvent.click(await screen.findByRole('button', { name: 'Imprimir o guardar PDF' }));
    expect(imprimir).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Imprimir o guardar PDF' }).closest('[data-no-imprimir]'),
    ).not.toBeNull();
  });
});
