import type { SaldoOperadora, UsuarioSesion } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/lib/auth-store';

import { dashboardApi } from '../api';
import { PanelPersonal } from './PanelPersonal';
import { SaludAnclaje } from './SaludAnclaje';

vi.mock('../api', () => ({
  dashboardApi: {
    saldoOperadora: vi.fn(),
    porValidar: vi.fn(),
    resumenPagos: vi.fn(),
    resumenRecibos: vi.fn(),
  },
}));

const saldo = vi.mocked(dashboardApi.saldoOperadora);
const vacio = { data: [], meta: { page: 1, pageSize: 5, total: 0, totalPages: 0 } };

function conProveedores(nodo: React.ReactNode) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>{nodo}</MemoryRouter>
    </QueryClientProvider>
  );
}

function conSaldo(respuesta: SaldoOperadora) {
  saldo.mockResolvedValue(respuesta);
  render(conProveedores(<SaludAnclaje />));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(dashboardApi.porValidar).mockResolvedValue(vacio);
  vi.mocked(dashboardApi.resumenPagos).mockResolvedValue(vacio);
  vi.mocked(dashboardApi.resumenRecibos).mockResolvedValue(vacio);
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

describe('SaludAnclaje (HU-42)', () => {
  it('muestra el saldo en POL y el umbral', async () => {
    conSaldo({
      disponible: true,
      pol: '9999.9987',
      umbralPol: '0.5',
      bajoUmbral: false,
      actualizadoEn: '2026-10-24T15:00:00.000Z',
    });

    expect(await screen.findByTestId('saldo-operadora')).toHaveTextContent('9.999,9987 POL');
    expect(screen.getByText(/Umbral 0,5 POL/)).toBeInTheDocument();
    expect(screen.queryByText(/Saldo bajo/)).not.toBeInTheDocument();
  });

  it('bajo el umbral avisa con texto e icono, no solo con color', async () => {
    conSaldo({
      disponible: true,
      pol: '0.4',
      umbralPol: '0.5',
      bajoUmbral: true,
      actualizadoEn: '2026-10-24T15:00:00.000Z',
    });

    const aviso = await screen.findByText('Saldo bajo: recargue la cuenta operadora');
    expect(aviso.closest('[role="alert"]')).not.toBeNull();
    expect(aviso.closest('[role="alert"]')?.querySelector('svg')).not.toBeNull();
  });

  it('sin datos del worker muestra el estado vacío', async () => {
    conSaldo({ disponible: false });

    expect(await screen.findByText('Sin datos del saldo')).toBeInTheDocument();
  });
});

describe('PanelPersonal y la salud del anclaje', () => {
  const usuario = (rol: UsuarioSesion['rol']) =>
    ({ id: 'u1', email: 'x@oasis.com', nombre: 'X', rol }) as UsuarioSesion;

  it('el ADMIN ve el panel de saldo', async () => {
    useAuthStore.setState({ accessToken: 't', usuario: usuario('ADMIN'), autenticado: true });
    saldo.mockResolvedValue({ disponible: false });
    render(conProveedores(<PanelPersonal />));

    expect(await screen.findByRole('heading', { name: 'Salud del anclaje' })).toBeInTheDocument();
  });

  it('el OPERADOR no ve el panel ni consulta el saldo', async () => {
    useAuthStore.setState({ accessToken: 't', usuario: usuario('OPERADOR'), autenticado: true });
    render(conProveedores(<PanelPersonal />));

    await screen.findByText('Por validar');
    expect(screen.queryByRole('heading', { name: 'Salud del anclaje' })).not.toBeInTheDocument();
    expect(saldo).not.toHaveBeenCalled();
  });
});
