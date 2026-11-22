import type { Rol } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/lib/auth-store';

import { recibosApi } from '../api';
import { RECIBO_ID, reciboDetalle } from '../test-datos';
import { ReciboDetallePage } from './ReciboDetallePage';

vi.mock('../api', () => ({
  recibosApi: { obtener: vi.fn(), reintentar: vi.fn(), ultimoReintento: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const obtener = vi.mocked(recibosApi.obtener);

function iniciarSesion(rol: Rol) {
  useAuthStore.setState({
    accessToken: 't',
    autenticado: true,
    usuario: { id: 'u1', email: `${rol.toLowerCase()}@oasis.com`, nombre: rol, rol },
  });
}

function montar() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[`/recibos/${RECIBO_ID}`]}>
        <Routes>
          <Route path="/recibos/:id" element={<ReciboDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(recibosApi.ultimoReintento).mockResolvedValue(null);
  iniciarSesion('ADMIN');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

describe('ReciboDetallePage — estado de anclaje (HU-24)', () => {
  it('un recibo ENVIADO se vuelve a pedir a los 10 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    obtener.mockResolvedValue(reciboDetalle({ estado: 'ENVIADO', ancladoEn: null }));
    montar();
    await screen.findByRole('list', { name: 'Línea de tiempo del anclaje' });
    expect(obtener).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(9_000));
    expect(obtener).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1_500));
    expect(obtener).toHaveBeenCalledTimes(2);
  });

  it('un recibo ANCLADO no se vuelve a pedir', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    obtener.mockResolvedValue(reciboDetalle());
    montar();
    await screen.findByRole('list', { name: 'Línea de tiempo del anclaje' });

    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(obtener).toHaveBeenCalledTimes(1);
  });

  it('no muestra el payload ni la sal', async () => {
    obtener.mockResolvedValue(reciboDetalle());
    montar();
    await screen.findByRole('list', { name: 'Línea de tiempo del anclaje' });
    expect(document.body.textContent).not.toMatch(/payload/i);
  });

  it('un recibo que nunca se ancló nombra la red sin decir que está anclado', async () => {
    obtener.mockResolvedValue(reciboDetalle({ estado: 'PENDIENTE_ANCLAJE', ancladoEn: null }));
    montar();
    await screen.findByRole('list', { name: 'Línea de tiempo del anclaje' });

    expect(screen.getByText('Red de anclaje: Polygon Amoy')).toBeInTheDocument();
    expect(screen.queryByText(/Anclado en la red/)).not.toBeInTheDocument();
  });
});

describe('ReciboDetallePage — imprimible (HU-25)', () => {
  it('enlaza la vista imprimible del recibo', async () => {
    obtener.mockResolvedValue(reciboDetalle());
    montar();
    expect(await screen.findByRole('link', { name: 'Imprimir' })).toHaveAttribute(
      'href',
      `/recibos/${RECIBO_ID}/imprimir`,
    );
  });
});

describe('ReciboDetallePage — reintento (HU-26)', () => {
  it('el OPERADOR no ve «Reintentar anclaje» ni en un recibo fallido', async () => {
    iniciarSesion('OPERADOR');
    obtener.mockResolvedValue(reciboDetalle({ estado: 'FALLIDO', ancladoEn: null }));
    montar();
    await screen.findByRole('list', { name: 'Línea de tiempo del anclaje' });
    expect(screen.queryByRole('button', { name: 'Reintentar anclaje' })).not.toBeInTheDocument();
    expect(recibosApi.ultimoReintento).not.toHaveBeenCalled();
  });

  it('el ADMIN no lo ve en un recibo que no está fallido', async () => {
    obtener.mockResolvedValue(reciboDetalle());
    montar();
    await screen.findByRole('list', { name: 'Línea de tiempo del anclaje' });
    expect(screen.queryByRole('button', { name: 'Reintentar anclaje' })).not.toBeInTheDocument();
  });

  it('el ADMIN confirma antes de reintentar y luego ve «Último reintento»', async () => {
    obtener.mockResolvedValue(reciboDetalle({ estado: 'FALLIDO', ancladoEn: null }));
    vi.mocked(recibosApi.reintentar).mockResolvedValue(
      reciboDetalle({ estado: 'PENDIENTE_ANCLAJE', ancladoEn: null }),
    );
    montar();

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar anclaje' }));
    expect(recibosApi.reintentar).not.toHaveBeenCalled();
    expect(await screen.findByRole('alertdialog')).toHaveTextContent(/se vuelve a encolar/i);

    vi.mocked(recibosApi.ultimoReintento).mockResolvedValue({
      usuarioEmail: 'admin@oasis.com',
      creadoEn: '2026-10-21T15:30:00.000Z',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(recibosApi.reintentar).toHaveBeenCalledWith(RECIBO_ID));
    expect(await screen.findByText(/Último reintento/)).toHaveTextContent(
      /Último reintento: admin@oasis.com, 21\/10\/2026/,
    );
  });
});
