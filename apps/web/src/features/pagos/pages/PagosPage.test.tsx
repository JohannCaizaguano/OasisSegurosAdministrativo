import type {
  Cliente,
  Pago,
  PagoDetalle,
  Poliza,
  RespuestaPaginada,
  ValidarPagoResponse,
} from '@oasis/shared';
import { MOTIVOS_RECHAZO_FRECUENTES } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router-dom';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clientesApi } from '@/features/clientes/api';
import { polizasApi } from '@/features/polizas/api';

import { pagosApi } from '../api';
import { PagosPage } from './PagosPage';

vi.mock('../api', () => ({
  pagosApi: {
    listar: vi.fn(),
    obtener: vi.fn(),
    crear: vi.fn(),
    validar: vi.fn(),
    rechazar: vi.fn(),
  },
}));
vi.mock('@/features/polizas/api', () => ({
  polizasApi: { listar: vi.fn(), cuotas: vi.fn(), obtener: vi.fn() },
}));
vi.mock('@/features/clientes/api', () => ({ clientesApi: { listar: vi.fn(), obtener: vi.fn() } }));
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

const CLIENTE_ID = '11111111-1111-4111-8111-111111111111';
const CLIENTE = {
  id: CLIENTE_ID,
  tipoIdentificacion: 'CEDULA',
  identificacion: '1710034065',
  nombres: 'Ana',
  apellidos: 'Pérez',
  activo: true,
} as unknown as Cliente;

beforeEach(() => {
  vi.clearAllMocks();
  listar.mockResolvedValue(paginada([PAGO]));
  vi.mocked(polizasApi.cuotas).mockResolvedValue([
    {
      id: 'c1',
      numero: 1,
      valor: '9000.00',
      valorPagado: '0.00',
      fechaVencimiento: '2099-01-01',
      estado: 'PENDIENTE',
      aplicaciones: [],
    },
  ]);
  vi.mocked(clientesApi.listar).mockResolvedValue(paginada([CLIENTE]));
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

describe('PagosPage — filtros y detalle (HU-20, HU-36)', () => {
  it('cambiar la fecha «Desde» actualiza la URL y la consulta', async () => {
    montar();
    await screen.findByTestId(`fila-pago-${PAGO.id}`);

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });

    await waitFor(() =>
      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/pagos?desde=2026-10-01'),
    );
    expect(screen.getByTestId('tipo-navegacion')).toHaveTextContent('REPLACE');
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ desde: '2026-10-01' })),
    );
  });

  it('al recargar con los filtros en la URL los conserva', async () => {
    montar(
      `/pagos?estado=VALIDADO&desde=2026-10-01&hasta=2026-10-31&clienteId=${CLIENTE_ID}&polizaId=${PAGO.polizaId}`,
    );

    await waitFor(() =>
      expect(listar).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'VALIDADO',
          desde: '2026-10-01',
          hasta: '2026-10-31',
          clienteId: CLIENTE_ID,
          polizaId: PAGO.polizaId,
        }),
      ),
    );
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-10-01');
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-10-31');
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument();
  });

  it('«Hasta» anterior a «Desde» se indica bajo el campo y no se envía', async () => {
    montar('/pagos?desde=2026-10-10&hasta=2026-10-01');

    expect(
      await screen.findByText('La fecha «hasta» no puede ser anterior a «desde»'),
    ).toHaveAttribute('role', 'alert');
    expect(listar).toHaveBeenCalledWith(expect.not.objectContaining({ hasta: '2026-10-01' }));
  });

  it('el filtro de cliente envía clienteId', async () => {
    montar();
    const combobox = await screen.findByRole('combobox', { name: 'Cliente' });
    fireEvent.focus(combobox);
    fireEvent.change(combobox, { target: { value: 'Ana' } });
    fireEvent.click(await screen.findByRole('option', { name: /Ana Pérez/ }));

    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ clienteId: CLIENTE_ID })),
    );
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(`clienteId=${CLIENTE_ID}`);
  });

  it('muestra el total del filtro sobre la tabla', async () => {
    listar.mockResolvedValue({
      data: [PAGO],
      meta: { page: 1, pageSize: 20, total: 128, totalPages: 7 },
    });
    montar();
    expect(await screen.findByText('128 pagos')).toBeInTheDocument();
  });

  it('el detalle muestra las aplicaciones por cuota y enlaza el recibo', async () => {
    const detalle: PagoDetalle = {
      ...PAGO,
      monto: '160.00',
      estado: 'VALIDADO',
      validadoEn: '2026-10-21T15:00:00.000Z',
      aplicaciones: [
        { cuotaNumero: 1, monto: '120.00' },
        { cuotaNumero: 2, monto: '40.00' },
      ],
      recibo: { id: RECIBO_ID, codigo: 'RC-0A1B2C3D4E5F', estado: 'ANCLADO' },
    };
    vi.mocked(pagosApi.obtener).mockResolvedValue(detalle);
    montar();

    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle del pago DB-0009' }));
    const hoja = await screen.findByRole('dialog', { name: 'Detalle del pago' });

    const aplicaciones = await within(hoja).findByRole('list', { name: 'Aplicación a cuotas' });
    const items = within(aplicaciones).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/Cuota 1.*\$120,00/);
    expect(items[1]).toHaveTextContent(/Cuota 2.*\$40,00/);
    expect(within(hoja).getByRole('link', { name: /RC-0A1B2C3D4E5F/ })).toHaveAttribute(
      'href',
      `/recibos/${RECIBO_ID}`,
    );
    expect(pagosApi.obtener).toHaveBeenCalledWith(PAGO.id);
  });
});

describe('PagosPage — filtros de póliza y cliente visibles (T20)', () => {
  it('al recargar con ?polizaId= el combobox muestra el número de la póliza', async () => {
    vi.mocked(polizasApi.obtener).mockResolvedValue({
      id: PAGO.polizaId,
      numero: PAGO.numeroPoliza,
    } as Poliza);
    montar(`/pagos?polizaId=${PAGO.polizaId}`);

    const combobox = await screen.findByRole('combobox', { name: 'Póliza' });
    await waitFor(() => expect(combobox).toHaveValue(PAGO.numeroPoliza));
    expect(polizasApi.obtener).toHaveBeenCalledWith(PAGO.polizaId);
  });

  it('al recargar con ?clienteId= el combobox muestra el nombre del cliente', async () => {
    vi.mocked(clientesApi.obtener).mockResolvedValue(CLIENTE);
    montar(`/pagos?clienteId=${CLIENTE_ID}`);

    const combobox = await screen.findByRole('combobox', { name: 'Cliente' });
    await waitFor(() => expect(combobox).toHaveValue('Ana Pérez'));
    expect(clientesApi.obtener).toHaveBeenCalledWith(CLIENTE_ID);
  });

  it('el filtro de póliza encuentra una póliza cancelada', async () => {
    const cancelada = {
      id: '66666666-6666-4666-8666-666666666666',
      numero: 'POL-0099',
      estado: 'CANCELADA',
    } as Poliza;
    vi.mocked(polizasApi.listar).mockImplementation(async (filtros = {}) =>
      paginada(filtros.estado === 'VIGENTE' ? [] : [cancelada]),
    );
    montar();
    const combobox = screen.getByRole('combobox', { name: 'Póliza' });
    fireEvent.focus(combobox);
    fireEvent.change(combobox, { target: { value: 'POL' } });

    expect(await screen.findByRole('option', { name: /POL-0099/ })).toBeInTheDocument();
    expect(polizasApi.listar).toHaveBeenCalledWith(
      expect.not.objectContaining({ estado: 'VIGENTE' }),
    );
  });

  it('si el cliente del filtro no se pudo cargar, lo explica y deja el combobox usable', async () => {
    vi.mocked(clientesApi.obtener).mockRejectedValue(new Error('no encontrado'));
    montar(`/pagos?clienteId=${CLIENTE_ID}`);

    expect(await screen.findByText(/no se pudo cargar el cliente del filtro/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toBeEnabled();
  });

  it('«Limpiar filtros» vacía la etiqueta inicial y la URL', async () => {
    vi.mocked(clientesApi.obtener).mockResolvedValue(CLIENTE);
    montar(`/pagos?clienteId=${CLIENTE_ID}`);
    const combobox = await screen.findByRole('combobox', { name: 'Cliente' });
    await waitFor(() => expect(combobox).toHaveValue('Ana Pérez'));

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/pagos$/));
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveValue('');
  });

  it('escribir sobre la etiqueta inicial quita el filtro sin dejar el nombre viejo', async () => {
    vi.mocked(clientesApi.obtener).mockResolvedValue(CLIENTE);
    montar(`/pagos?clienteId=${CLIENTE_ID}`);
    const combobox = await screen.findByRole('combobox', { name: 'Cliente' });
    await waitFor(() => expect(combobox).toHaveValue('Ana Pérez'));

    fireEvent.change(combobox, { target: { value: 'Bea' } });

    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/pagos$/));
    expect(combobox).toHaveValue('Bea');
  });
});
