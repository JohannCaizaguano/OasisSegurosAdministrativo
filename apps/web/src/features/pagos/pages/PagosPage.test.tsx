import type { Pago, RespuestaPaginada, ValidarPagoResponse } from '@oasis/shared';
import { MOTIVOS_RECHAZO_FRECUENTES } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router-dom';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pagosApi } from '../api';
import { PagosPage } from './PagosPage';

vi.mock('../api', () => ({
  pagosApi: { listar: vi.fn(), crear: vi.fn(), validar: vi.fn(), rechazar: vi.fn() },
}));
vi.mock('@/features/polizas/api', () => ({ polizasApi: { listar: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const listar = vi.mocked(pagosApi.listar);
const validar = vi.mocked(pagosApi.validar);
const rechazar = vi.mocked(pagosApi.rechazar);

const PAGO: Pago = {
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
};

const RECIBO_ID = '9b2f6c1d-3e4a-4b5c-8d6e-7f8091a2b3c4';

function paginada<T>(items: T[]): RespuestaPaginada<T> {
  return { data: items, meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } };
}

function Ubicacion() {
  const { pathname, search } = useLocation();
  const tipo = useNavigationType();
  return (
    <>
      <output data-testid="ubicacion">{pathname + search}</output>
      <output data-testid="tipo-navegacion">{tipo}</output>
    </>
  );
}

function montar(ruta = '/pagos') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <PagosPage />
        <Ubicacion />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listar.mockResolvedValue(paginada([PAGO]));
});

afterEach(cleanup);

describe('PagosPage (HU-16, HU-18, HU-19)', () => {
  it('valida desde la fila en tres acciones y avisa el código del recibo con enlace al detalle', async () => {
    validar.mockResolvedValue({
      pago: { ...PAGO, estado: 'VALIDADO' },
      recibo: { id: RECIBO_ID, codigo: 'RC-0A1B2C3D4E5F', estado: 'PENDIENTE_ANCLAJE' },
    } as ValidarPagoResponse);
    montar();
    let acciones = 0;
    const accion = (elemento: HTMLElement) => {
      acciones += 1;
      fireEvent.click(elemento);
    };

    accion(await screen.findByTestId(`boton-validar-${PAGO.id}`));
    const dialogo = await screen.findByRole('dialog', { name: 'Validar pago' });
    accion(within(dialogo).getByLabelText(/confirmo que revisé/i));
    accion(within(dialogo).getByTestId('confirmar-validar'));

    await waitFor(() =>
      expect(validar).toHaveBeenCalledWith(PAGO.id, { confirmado: true, nota: undefined }),
    );
    expect(acciones).toBe(3);
    expect(toast.success).toHaveBeenCalledWith(
      'Recibo RC-0A1B2C3D4E5F emitido',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Ver recibo' }) }),
    );
  });

  it('rechazar no se habilita sin motivo; con un chip envía el motivo', async () => {
    rechazar.mockResolvedValue({ ...PAGO, estado: 'RECHAZADO' });
    montar();

    fireEvent.click(await screen.findByTestId(`boton-rechazar-${PAGO.id}`));
    const dialogo = await screen.findByRole('dialog', { name: 'Rechazar pago' });
    const confirmar = within(dialogo).getByTestId('confirmar-rechazar');
    expect(confirmar).toBeDisabled();

    fireEvent.click(within(dialogo).getByRole('button', { name: MOTIVOS_RECHAZO_FRECUENTES[0] }));
    fireEvent.click(confirmar);

    await waitFor(() =>
      expect(rechazar).toHaveBeenCalledWith(PAGO.id, {
        confirmado: true,
        motivo: MOTIVOS_RECHAZO_FRECUENTES[0],
      }),
    );
  });

  it('un pago rechazado muestra la fecha de su rechazo (D8)', async () => {
    listar.mockResolvedValue(
      paginada([
        {
          ...PAGO,
          estado: 'RECHAZADO',
          rechazadoPorId: '11111111-1111-4111-8111-111111111111',
          rechazadoEn: '2026-10-21T15:30:00.000Z',
        },
      ]),
    );
    montar();

    const fila = await screen.findByTestId(`fila-pago-${PAGO.id}`);
    expect(within(fila).getByText('21/10/2026, 10:30')).toBeInTheDocument();
  });

  it('muestra el método con su etiqueta y abre el formulario con «Registrar pago»', async () => {
    montar();

    expect(await screen.findByText('Débito bancario')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('boton-nuevo-pago'));
    expect(await screen.findByRole('dialog', { name: 'Registrar pago' })).toBeInTheDocument();
  });

  it('/pagos?estado=REGISTRADO abre con el filtro «Registrados»', async () => {
    montar('/pagos?estado=REGISTRADO');

    expect(await screen.findByTestId('filtro-estado-pagos')).toHaveTextContent('Registrados');
    await waitFor(() =>
      expect(listar).toHaveBeenCalledWith(expect.objectContaining({ estado: 'REGISTRADO' })),
    );
  });

  it('un estado desconocido en la URL abre en «Todos»', async () => {
    montar('/pagos?estado=OTRO');

    expect(await screen.findByTestId('filtro-estado-pagos')).toHaveTextContent('Todos los estados');
    await waitFor(() => expect(listar).toHaveBeenCalled());
    expect(listar).not.toHaveBeenCalledWith(expect.objectContaining({ estado: expect.anything() }));
  });

  it('cambiar el filtro actualiza la URL sin agregar entradas al historial', async () => {
    montar();

    fireEvent.click(await screen.findByTestId('filtro-estado-pagos'));
    fireEvent.click(await screen.findByRole('option', { name: 'Validados' }));

    await waitFor(() =>
      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/pagos?estado=VALIDADO'),
    );
    expect(screen.getByTestId('tipo-navegacion')).toHaveTextContent('REPLACE');
  });

  it('«Quitar filtro» vuelve a «Todos» y deja la URL sin estado', async () => {
    listar.mockResolvedValue(paginada([]));
    montar('/pagos?estado=RECHAZADO');

    fireEvent.click(await screen.findByRole('button', { name: 'Quitar filtro' }));

    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/pagos$/));
    expect(screen.getByTestId('filtro-estado-pagos')).toHaveTextContent('Todos los estados');
  });
});
