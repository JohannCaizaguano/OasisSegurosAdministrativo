import type { Cuota, Pago, Poliza } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pagosApi } from '@/features/pagos/api';

import { polizasApi } from '../api';
import { PolizaDetallePage } from './PolizaDetallePage';

vi.mock('../api', () => ({ polizasApi: { obtener: vi.fn(), cuotas: vi.fn() } }));
vi.mock('@/features/pagos/api', () => ({ pagosApi: { listar: vi.fn() } }));

const POLIZA_ID = '55555555-5555-4555-8555-555555555555';
const PAGO_ID = '7c1e5a90-2b3d-4f6a-9e8c-1d2b3a4c5d6e';

const POLIZA: Poliza = {
  id: POLIZA_ID,
  numero: 'POL-0001',
  clienteId: '33333333-3333-4333-8333-333333333333',
  aseguradoraId: '44444444-4444-4444-8444-444444444444',
  ramoId: '66666666-6666-4666-8666-666666666666',
  ramo: 'Vehículos',
  ramoCodigo: 'VEHICULOS',
  primaTotal: '240.00',
  cobertura: 'Daños propios\nRobo total',
  condiciones: 'Deducible del 10 %',
  fechaInicio: '2026-01-01',
  fechaFin: '2026-12-31',
  estado: 'VIGENTE',
  clienteNombre: 'Ana Pérez',
  aseguradoraNombre: 'Seguros Unidos',
  tienePagosValidados: true,
  enMora: false,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

const CUOTAS: Cuota[] = [
  {
    id: 'c1',
    numero: 1,
    valor: '120.00',
    valorPagado: '120.00',
    fechaVencimiento: '2026-01-01',
    estado: 'PAGADA',
    aplicaciones: [{ pagoId: PAGO_ID, monto: '120.00', fecha: '2026-01-05T15:00:00.000Z' }],
  },
  {
    id: 'c2',
    numero: 2,
    valor: '120.00',
    valorPagado: '40.00',
    fechaVencimiento: '2099-07-01',
    estado: 'PARCIAL',
    aplicaciones: [{ pagoId: PAGO_ID, monto: '40.00', fecha: '2026-01-05T15:00:00.000Z' }],
  },
];

const PAGO: Pago = {
  id: PAGO_ID,
  polizaId: POLIZA_ID,
  numeroPoliza: 'POL-0001',
  monto: '160.00',
  fechaPago: '2026-01-04',
  metodo: 'DEBITO_BANCARIO',
  referencia: 'DB-0009',
  estado: 'VALIDADO',
  createdAt: '2026-01-04T10:00:00.000Z',
  updatedAt: '2026-01-05T15:00:00.000Z',
};

function montar() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[`/polizas/${POLIZA_ID}`]}>
        <Routes>
          <Route path="/polizas/:id" element={<PolizaDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(polizasApi.obtener).mockResolvedValue(POLIZA);
  vi.mocked(polizasApi.cuotas).mockResolvedValue(CUOTAS);
  vi.mocked(pagosApi.listar).mockResolvedValue({
    data: [PAGO],
    meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
  });
});

afterEach(cleanup);

describe('PolizaDetallePage (HU-51, HU-36)', () => {
  it('muestra cobertura y condiciones con sus saltos de línea y la vigencia', async () => {
    montar();
    expect(await screen.findByRole('heading', { name: 'Póliza POL-0001' })).toBeInTheDocument();

    const cobertura = screen.getByTestId('cobertura');
    expect(cobertura.textContent).toBe('Daños propios\nRobo total');
    expect(cobertura).toHaveClass('whitespace-pre-line');
    expect(screen.getByTestId('condiciones')).toHaveTextContent('Deducible del 10 %');
    expect(screen.getByText('01/01/2026 – 31/12/2026')).toBeInTheDocument();
    expect(screen.getByText('Vehículos')).toBeInTheDocument();
  });

  it('sin cobertura lo dice en lugar de dejar el bloque vacío', async () => {
    vi.mocked(polizasApi.obtener).mockResolvedValue({ ...POLIZA, cobertura: null });
    montar();
    expect(await screen.findByText('Sin cobertura registrada.')).toBeInTheDocument();
  });

  it('las aplicaciones aparecen bajo su cuota, con su estado', async () => {
    montar();
    const plan = await screen.findByRole('list', { name: 'Plan de cuotas' });
    const [primera, segunda] = within(plan).getAllByRole('listitem', { name: /^Cuota \d/ });

    expect(within(primera).getByText('Pagada')).toHaveAttribute('data-estado', 'PAGADA');
    expect(
      within(primera).getByRole('list', { name: 'Pagos aplicados a la cuota 1' }),
    ).toHaveTextContent(/05\/01\/2026.*\$120,00/);
    expect(within(segunda).getByText('Pago parcial')).toBeInTheDocument();
    expect(
      within(segunda).getByRole('list', { name: 'Pagos aplicados a la cuota 2' }),
    ).toHaveTextContent('$40,00');
  });

  it('lista los pagos de la póliza', async () => {
    montar();
    expect(await screen.findByText('DB-0009')).toBeInTheDocument();
    expect(pagosApi.listar).toHaveBeenCalledWith(expect.objectContaining({ polizaId: POLIZA_ID }));
  });
});
