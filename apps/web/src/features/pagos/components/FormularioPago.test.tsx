import type { Cuota, Pago, Poliza } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { polizasApi } from '@/features/polizas/api';
import { ApiError } from '@/lib/api-client';

import { pagosApi } from '../api';
import { FormularioPago } from './FormularioPago';

vi.mock('../api', () => ({ pagosApi: { crear: vi.fn() } }));
vi.mock('@/features/polizas/api', () => ({ polizasApi: { listar: vi.fn(), cuotas: vi.fn() } }));

const crear = vi.mocked(pagosApi.crear);
const listarPolizas = vi.mocked(polizasApi.listar);
const cuotas = vi.mocked(polizasApi.cuotas);

function cuota(numero: number, valor = '120.00'): Cuota {
  return {
    id: `c${numero}`,
    numero,
    valor,
    valorPagado: '0.00',
    fechaVencimiento: `2099-0${numero}-01`,
    estado: 'PENDIENTE',
    aplicaciones: [],
  };
}

const POLIZA_ID = '55555555-5555-4555-8555-555555555555';
const POLIZA = {
  id: POLIZA_ID,
  numero: 'POL-2026-0001',
  clienteNombre: 'María Cabrera',
  estado: 'VIGENTE',
} as Poliza;

function montar() {
  const alGuardar = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FormularioPago alGuardar={alGuardar} />
    </QueryClientProvider>,
  );
  return { alGuardar };
}

async function elegirPoliza() {
  const combobox = screen.getByRole('combobox', { name: 'Póliza' });
  fireEvent.focus(combobox);
  fireEvent.change(combobox, { target: { value: 'POL' } });
  fireEvent.click(await screen.findByRole('option', { name: /POL-2026-0001/ }));
}

function llenar(campos: { monto?: string; referencia?: string }) {
  if (campos.monto !== undefined) {
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: campos.monto } });
  }
  if (campos.referencia !== undefined) {
    fireEvent.change(screen.getByLabelText('Referencia'), {
      target: { value: campos.referencia },
    });
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  cuotas.mockResolvedValue([cuota(1, '9000.00')]);
  listarPolizas.mockResolvedValue({
    data: [POLIZA],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
});

afterEach(cleanup);

describe('FormularioPago — vista previa de las cuotas (D24)', () => {
  it('bajo el monto dice en condicional qué cuotas cubriría', async () => {
    cuotas.mockResolvedValue([cuota(1), cuota(2)]);
    montar();
    await elegirPoliza();
    llenar({ monto: '160.00' });

    const frase = await screen.findByText(
      'Este pago cubriría: la cuota 1 quedaría Pagada y la cuota 2 recibiría $40,00 (Pago parcial).',
    );
    // Cambia con cada tecla del monto: sin región viva para no repetir el anuncio.
    expect(frase).not.toHaveAttribute('role');
    expect(frase).not.toHaveAttribute('aria-live');
    expect(cuotas).toHaveBeenCalledWith(POLIZA_ID);
  });

  it('un monto mayor que lo pendiente muestra el aviso de saldo sin llamar al API', async () => {
    cuotas.mockResolvedValue([cuota(1), cuota(2)]);
    montar();
    await elegirPoliza();
    llenar({ monto: '300.00', referencia: 'DB-0010' });

    expect(await screen.findByText('Supera el saldo pendiente ($240,00).')).toHaveAttribute(
      'role',
      'alert',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Monto')).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(crear).not.toHaveBeenCalled();
  });
});

describe('FormularioPago (HU-16)', () => {
  it('no ofrece pólizas que no estén vigentes (RN-01)', async () => {
    listarPolizas.mockImplementation(async (filtros = {}) => ({
      data:
        filtros.estado === 'VIGENTE'
          ? [POLIZA]
          : [POLIZA, { ...POLIZA, id: 'p-cancelada', numero: 'POL-0099', estado: 'CANCELADA' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }));
    montar();
    const combobox = screen.getByRole('combobox', { name: 'Póliza' });
    fireEvent.focus(combobox);
    fireEvent.change(combobox, { target: { value: 'POL' } });

    expect(await screen.findByRole('option', { name: /POL-2026-0001/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /POL-0099/ })).not.toBeInTheDocument();
  });

  it('busca solo pólizas vigentes y ofrece Débito bancario como método por defecto', async () => {
    montar();
    await elegirPoliza();

    expect(listarPolizas).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'VIGENTE', pageSize: 20 }),
    );
    expect(screen.getByLabelText('Método')).toHaveTextContent('Débito bancario');
  });

  it('no envía sin referencia y lo indica bajo el campo', async () => {
    montar();
    await elegirPoliza();
    llenar({ monto: '100.00' });

    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    expect(await screen.findByText('La referencia es obligatoria')).toBeInTheDocument();
    expect(screen.getByLabelText('Referencia')).toHaveAttribute('aria-invalid', 'true');
    expect(crear).not.toHaveBeenCalled();
  });

  it('envía póliza, monto, fecha de hoy, método y referencia', async () => {
    crear.mockResolvedValue({ id: 'p1' } as Pago);
    const { alGuardar } = montar();
    await elegirPoliza();
    llenar({ monto: '100.00', referencia: 'DB-0001' });

    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    await waitFor(() => expect(alGuardar).toHaveBeenCalled());
    expect(crear).toHaveBeenCalledWith({
      polizaId: POLIZA_ID,
      monto: '100.00',
      fechaPago: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      metodo: 'DEBITO_BANCARIO',
      referencia: 'DB-0001',
    });
  });

  it('muestra el error de saldo del API bajo el monto, con el saldo en formato de Ecuador', async () => {
    crear.mockRejectedValue(
      new ApiError(
        {
          message: 'El monto supera el saldo pendiente de la póliza (RN-02)',
          code: 'REGLA_NEGOCIO',
          details: { campo: 'monto', motivo: 'MONTO_SUPERA_SALDO', saldo: '518.40' },
        },
        422,
      ),
    );
    montar();
    await elegirPoliza();
    llenar({ monto: '600.00', referencia: 'DB-0002' });

    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    const error = await screen.findByText('Supera el saldo pendiente ($518,40).');
    expect(error).toHaveAttribute('role', 'alert');
    expect(screen.getByLabelText('Monto')).toHaveAttribute('aria-invalid', 'true');
  });

  it('muestra la referencia repetida bajo la referencia', async () => {
    crear.mockRejectedValue(
      new ApiError(
        {
          message: 'La referencia ya está registrada en esta póliza',
          code: 'CONFLICTO',
          details: { campo: 'referencia', motivo: 'REFERENCIA_DUPLICADA' },
        },
        409,
      ),
    );
    montar();
    await elegirPoliza();
    llenar({ monto: '10.00', referencia: 'DB-0001' });

    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    expect(
      await screen.findByText('La referencia ya está registrada en esta póliza'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Referencia')).toHaveAttribute('aria-invalid', 'true');
  });

  it('muestra la póliza no vigente bajo la póliza', async () => {
    crear.mockRejectedValue(
      new ApiError(
        {
          message: 'La póliza no está vigente y no admite pagos (RN-01)',
          code: 'REGLA_NEGOCIO',
          details: { campo: 'polizaId', motivo: 'POLIZA_NO_VIGENTE' },
        },
        422,
      ),
    );
    montar();
    await elegirPoliza();
    llenar({ monto: '10.00', referencia: 'DB-0003' });

    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    expect(await screen.findByText(/no está vigente/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Póliza' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('cada campo enlaza su ayuda y, con error, también el error', async () => {
    montar();
    const ayudas: Array<[HTMLElement, string, string]> = [
      [
        screen.getByRole('combobox', { name: 'Póliza' }),
        'pago-poliza',
        'Solo aparecen pólizas vigentes.',
      ],
      [
        screen.getByLabelText('Monto'),
        'pago-monto',
        'En dólares, con punto decimal. No puede superar el saldo pendiente de la póliza.',
      ],
      [
        screen.getByLabelText('Fecha de pago'),
        'pago-fecha',
        'El día en que se hizo el pago; no puede ser posterior a hoy.',
      ],
      [
        screen.getByLabelText('Referencia'),
        'pago-referencia',
        'Número del comprobante o del débito. No se repite en la misma póliza.',
      ],
    ];
    for (const [control, id, texto] of ayudas) {
      expect(control.getAttribute('aria-describedby')?.split(' ')).toContain(`${id}-ayuda`);
      expect(document.getElementById(`${id}-ayuda`)).toHaveTextContent(texto);
    }

    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
    await screen.findByText('La referencia es obligatoria');
    const ids = screen.getByLabelText('Referencia').getAttribute('aria-describedby')?.split(' ');
    expect(ids).toEqual(expect.arrayContaining(['pago-referencia-error', 'pago-referencia-ayuda']));
  });
});
