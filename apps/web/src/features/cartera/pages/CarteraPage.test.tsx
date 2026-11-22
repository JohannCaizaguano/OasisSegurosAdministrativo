import type { Cliente, FilaCartera, RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clientesApi } from '@/features/clientes/api';
import { polizasApi } from '@/features/polizas/api';

import { carteraApi } from '../api';
import { CarteraPage } from './CarteraPage';

vi.mock('../api', () => ({ carteraApi: { listar: vi.fn() } }));
vi.mock('@/features/polizas/api', () => ({ polizasApi: { aseguradoras: vi.fn() } }));
vi.mock('@/features/clientes/api', () => ({ clientesApi: { listar: vi.fn(), obtener: vi.fn() } }));

const listar = vi.mocked(carteraApi.listar);

function fila(cambios: Partial<FilaCartera> = {}): FilaCartera {
  return {
    cuotaId: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
    numero: 2,
    valor: '120.00',
    pendiente: '120.00',
    fechaVencimiento: '2026-10-01',
    diasAtraso: 24,
    estado: 'VENCIDA',
    poliza: {
      id: '55555555-5555-4555-8555-555555555555',
      numero: 'POL-0001',
      ramo: 'Vida',
      ramoCodigo: 'VIDA',
      aseguradora: 'Seguros Unidos',
    },
    cliente: { id: '11111111-1111-4111-8111-111111111111', nombre: 'Ana Pérez' },
    ...cambios,
  };
}

function paginada(items: FilaCartera[]): RespuestaPaginada<FilaCartera> {
  return { data: items, meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } };
}

function Ubicacion() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacion">{pathname + search}</output>;
}

function montar(ruta = '/cartera') {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[ruta]}>
        <CarteraPage />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listar.mockResolvedValue(paginada([fila()]));
  vi.mocked(polizasApi.aseguradoras).mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
  });
});

afterEach(cleanup);

describe('CarteraPage (HU-38)', () => {
  it('cada fila muestra cliente, póliza enlazada, cuota, valor, vencimiento y días de atraso', async () => {
    montar();
    const filaTabla = (await screen.findByText('Ana Pérez')).closest('tr') as HTMLElement;

    expect(within(filaTabla).getByRole('link', { name: 'POL-0001' })).toHaveAttribute(
      'href',
      '/polizas/55555555-5555-4555-8555-555555555555',
    );
    expect(filaTabla).toHaveTextContent('Vida');
    expect(filaTabla).toHaveTextContent('$120,00');
    expect(filaTabla).toHaveTextContent('01/10/2026');
    const atraso = within(filaTabla).getByTestId('dias-atraso');
    expect(atraso).toHaveTextContent('24 días');
    expect(atraso).toHaveAttribute('data-tono', 'aviso');
    expect(within(filaTabla).getByText('Vencida')).toHaveAttribute('data-estado', 'VENCIDA');
  });

  it('más de 30 días de atraso van en tono de error y una cuota que no vence no cuenta días', async () => {
    listar.mockResolvedValue(
      paginada([
        fila({ diasAtraso: 45 }),
        fila({
          cuotaId: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4e',
          diasAtraso: 0,
          estado: 'PENDIENTE',
          fechaVencimiento: '2026-10-28',
        }),
      ]),
    );
    montar();
    const atrasos = await screen.findAllByTestId('dias-atraso');
    expect(atrasos[0]).toHaveAttribute('data-tono', 'error');
    expect(atrasos[1]).toHaveTextContent('Sin atraso');
    expect(atrasos[1].querySelector('[aria-hidden="true"]')).toHaveTextContent('—');
  });

  it('una parcial vencida dice cuánto se abonó (D11)', async () => {
    listar.mockResolvedValue(paginada([fila({ pendiente: '80.00' })]));
    montar();
    expect(await screen.findByText(/abonado/)).toHaveTextContent('· abonado $40,00');
  });

  it('«Por vencer» filtra la vista en la URL y explica el vacío', async () => {
    montar();
    await screen.findByText('Ana Pérez');
    listar.mockResolvedValue(paginada([]));

    fireEvent.click(screen.getByRole('button', { name: 'Por vencer' }));

    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ vista: 'POR_VENCER' })),
    );
    expect(screen.getByRole('button', { name: 'Por vencer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/cartera?vista=POR_VENCER');
    expect(
      await screen.findByText('No hay cuotas que venzan en los próximos 7 días'),
    ).toBeInTheDocument();
  });

  it('al recargar conserva vista, aseguradora y fechas de la URL', async () => {
    montar(
      '/cartera?vista=VENCIDAS&aseguradoraId=44444444-4444-4444-8444-444444444444&desde=2026-09-01&hasta=2026-09-30',
    );
    await waitFor(() =>
      expect(listar).toHaveBeenCalledWith(
        expect.objectContaining({
          vista: 'VENCIDAS',
          aseguradoraId: '44444444-4444-4444-8444-444444444444',
          desde: '2026-09-01',
          hasta: '2026-09-30',
        }),
      ),
    );
    expect(screen.getByRole('button', { name: 'Vencidas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('al recargar con ?clienteId= el combobox muestra el nombre del cliente', async () => {
    vi.mocked(clientesApi.obtener).mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      nombres: 'Ana',
      apellidos: 'Pérez',
    } as unknown as Cliente);
    montar('/cartera?clienteId=11111111-1111-4111-8111-111111111111');

    const combobox = await screen.findByRole('combobox', { name: 'Cliente' });
    await waitFor(() => expect(combobox).toHaveValue('Ana Pérez'));
    expect(clientesApi.obtener).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });

  it('explica cada estado de cuota con la leyenda', async () => {
    montar();
    expect(await screen.findByTestId('leyenda-estados')).toBeInTheDocument();
  });
});
