import type { Cuota, Poliza } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';

import { polizasApi } from '../api';
import { PlanCuotasDialog } from './PlanCuotasDialog';

vi.mock('../api', () => ({ polizasApi: { cuotas: vi.fn(), definirCuotas: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const cuotas = vi.mocked(polizasApi.cuotas);
const definirCuotas = vi.mocked(polizasApi.definirCuotas);

const POLIZA = {
  id: '55555555-5555-4555-8555-555555555555',
  numero: 'POL-0001',
  primaTotal: '100.00',
  fechaInicio: '2026-01-31',
  fechaFin: '2026-12-31',
  estado: 'VIGENTE',
  tienePagosValidados: false,
  enMora: false,
} as Poliza;

const CUOTA_UNICA: Cuota = {
  id: 'c1',
  numero: 1,
  valor: '100.00',
  valorPagado: '0.00',
  fechaVencimiento: '2026-01-31',
  estado: 'PENDIENTE',
};

function montar(poliza: Poliza = POLIZA) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <PlanCuotasDialog poliza={poliza} abierto alCambiarAbierto={vi.fn()} />
    </QueryClientProvider>,
  );
}

async function proponer(n: string) {
  fireEvent.click(await screen.findByRole('button', { name: 'Cambiar plan' }));
  fireEvent.change(screen.getByLabelText('Número de cuotas'), { target: { value: n } });
  fireEvent.click(screen.getByRole('button', { name: 'Proponer' }));
}

const valores = () =>
  screen.getAllByLabelText(/^Valor de la cuota/).map((e) => (e as HTMLInputElement).value);

beforeEach(() => {
  vi.clearAllMocks();
  cuotas.mockResolvedValue([CUOTA_UNICA]);
});

afterEach(cleanup);

describe('PlanCuotasDialog (HU-35)', () => {
  it('muestra el plan actual con número, valor, vencimiento y estado', async () => {
    montar();

    const fila = (await screen.findByText('31/01/2026')).closest('tr') as HTMLElement;
    expect(within(fila).getByText('$100,00')).toBeInTheDocument();
    expect(within(fila).getByText('Pendiente')).toBeInTheDocument();
  });

  it('propone 3 cuotas de 100 como 33,33 / 33,33 / 33,34 con fechas mensuales y dice «Cuadra»', async () => {
    montar();
    await proponer('3');

    expect(valores()).toEqual(['33.33', '33.33', '33.34']);
    expect(
      screen
        .getAllByLabelText(/^Vencimiento de la cuota/)
        .map((e) => (e as HTMLInputElement).value),
    ).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(screen.getByRole('status')).toHaveTextContent('Cuadra');
    expect(screen.getByRole('button', { name: 'Guardar plan' })).toBeEnabled();
  });

  it('si una cuota baja a 30 dice «Faltan $3,33» y no deja guardar', async () => {
    montar();
    await proponer('3');

    fireEvent.change(screen.getByLabelText('Valor de la cuota 1'), { target: { value: '30' } });

    expect(screen.getByRole('status')).toHaveTextContent('Faltan $3,33');
    expect(screen.getByRole('button', { name: 'Guardar plan' })).toBeDisabled();
  });

  it('guarda el plan propuesto', async () => {
    definirCuotas.mockResolvedValue([CUOTA_UNICA]);
    montar();
    await proponer('2');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar plan' }));

    await waitFor(() =>
      expect(definirCuotas).toHaveBeenCalledWith(POLIZA.id, {
        cuotas: [
          { numero: 1, valor: '50.00', fechaVencimiento: '2026-01-31' },
          { numero: 2, valor: '50.00', fechaVencimiento: '2026-02-28' },
        ],
      }),
    );
  });

  it('muestra el error 422 del API en el diálogo', async () => {
    definirCuotas.mockRejectedValue(
      new ApiError(
        {
          message: 'El plan no se puede cambiar: la póliza ya tiene pagos validados',
          code: 'REGLA_NEGOCIO',
          details: { motivo: 'PLAN_CON_PAGOS_VALIDADOS' },
        },
        422,
      ),
    );
    montar();
    await proponer('2');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar plan' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya tiene pagos validados/);
  });

  it('con pagos validados es de solo lectura y explica por qué', async () => {
    montar({ ...POLIZA, tienePagosValidados: true });

    expect(await screen.findByText('31/01/2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cambiar plan' })).not.toBeInTheDocument();
    expect(screen.getByText(/ya tiene pagos validados/)).toBeInTheDocument();
  });
});
