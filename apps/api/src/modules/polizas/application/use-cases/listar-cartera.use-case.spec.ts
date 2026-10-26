import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type {
  CuotaEnCartera,
  FiltrosCartera,
  PolizasRepositoryPort,
} from '../ports/polizas.repository.port';
import { ListarCarteraUseCase } from './listar-cartera.use-case';

// 10:00 del 25/10/2026 en Guayaquil.
const reloj: ClockPort = { ahora: () => new Date('2026-10-25T15:00:00.000Z') };

function cuota(cambios: Partial<CuotaEnCartera> = {}): CuotaEnCartera {
  return {
    cuotaId: 'c1',
    numero: 2,
    valor: '100.00',
    valorPagado: '0.00',
    fechaVencimiento: '2026-10-22',
    estado: 'PENDIENTE',
    poliza: {
      id: 'p1',
      numero: 'POL-1',
      ramo: 'Vehículos',
      ramoCodigo: 'VEHICULOS',
      aseguradora: 'Aseguradora del Pacífico C.A.',
    },
    cliente: { id: 'cl1', nombre: 'María Fernanda Cabrera Rosero' },
    ...cambios,
  };
}

function crear(items: CuotaEnCartera[] = []) {
  const listarCartera = jest.fn(async (_filtros: FiltrosCartera) => ({
    items,
    total: items.length,
  }));
  const polizas = { listarCartera } as unknown as PolizasRepositoryPort;
  return { caso: new ListarCarteraUseCase(polizas, reloj), listarCartera };
}

const PAGINA = { pagina: 1, porPagina: 20 };

describe('ListarCarteraUseCase (HU-38, D16)', () => {
  it('POR_VENCER pide de hoy a hoy + 7: una cuota que vence en 7 días entra y una en 8 no', async () => {
    const { caso, listarCartera } = crear();

    await caso.ejecutar({ ...PAGINA, vista: 'POR_VENCER' });

    expect(listarCartera).toHaveBeenCalledWith(
      expect.objectContaining({ vencimientoDesde: '2026-10-25', vencimientoHasta: '2026-11-01' }),
    );
  });

  it('VENCIDAS pide lo que venció antes de hoy, sin depender del estado que dejó el cron', async () => {
    const { caso, listarCartera } = crear();

    await caso.ejecutar({ ...PAGINA, vista: 'VENCIDAS' });

    const filtros = listarCartera.mock.calls[0]?.[0];
    expect(filtros?.vencimientoDesde).toBeUndefined();
    expect(filtros?.vencimientoHasta).toBe('2026-10-24');
  });

  it('TODAS une las dos vistas: todo lo no pagado que vence hasta hoy + 7', async () => {
    const { caso, listarCartera } = crear();

    await caso.ejecutar({ ...PAGINA, vista: 'TODAS' });

    const filtros = listarCartera.mock.calls[0]?.[0];
    expect(filtros?.vencimientoDesde).toBeUndefined();
    expect(filtros?.vencimientoHasta).toBe('2026-11-01');
  });

  it('intersecta el rango de fechas pedido con el de la vista y pasa cliente y aseguradora', async () => {
    const { caso, listarCartera } = crear();

    await caso.ejecutar({
      ...PAGINA,
      vista: 'POR_VENCER',
      desde: '2026-10-20',
      hasta: '2026-10-28',
      clienteId: 'cl1',
      aseguradoraId: 'as1',
    });

    expect(listarCartera).toHaveBeenCalledWith({
      ...PAGINA,
      vencimientoDesde: '2026-10-25',
      vencimientoHasta: '2026-10-28',
      clienteId: 'cl1',
      aseguradoraId: 'as1',
    });
  });

  it('una cuota vencida hace 3 días tiene diasAtraso = 3 aunque siga PENDIENTE', async () => {
    const { caso } = crear([cuota({ fechaVencimiento: '2026-10-22', estado: 'PENDIENTE' })]);

    const { items } = await caso.ejecutar({ ...PAGINA, vista: 'VENCIDAS' });

    expect(items[0]).toMatchObject({ diasAtraso: 3, estado: 'PENDIENTE' });
  });

  it('una cuota que aún no vence tiene diasAtraso = 0, también la que vence hoy', async () => {
    const { caso } = crear([
      cuota({ fechaVencimiento: '2026-10-30' }),
      cuota({ cuotaId: 'c2', fechaVencimiento: '2026-10-25' }),
    ]);

    const { items } = await caso.ejecutar({ ...PAGINA, vista: 'POR_VENCER' });

    expect(items.map((fila) => fila.diasAtraso)).toEqual([0, 0]);
  });

  it('una PARCIAL vencida aparece con su pendiente = valor − valorPagado', async () => {
    const { caso } = crear([
      cuota({
        valor: '100.00',
        valorPagado: '40.50',
        estado: 'VENCIDA',
        fechaVencimiento: '2026-09-25',
      }),
    ]);

    const { items, total } = await caso.ejecutar({ ...PAGINA, vista: 'TODAS' });

    expect(items[0]).toMatchObject({ valor: '100.00', pendiente: '59.50', diasAtraso: 30 });
    expect(items[0]).not.toHaveProperty('valorPagado');
    expect(total).toBe(1);
  });
});
