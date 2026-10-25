import { Poliza, type PropsPoliza } from '../../domain/poliza';
import type { PolizasRepositoryPort } from '../ports/polizas.repository.port';
import { DefinirPlanCuotasUseCase, ObtenerPlanCuotasUseCase } from './cuotas.use-cases';

const POLIZA_ID = '11111111-1111-1111-1111-111111111111';

function poliza(parcial: Partial<PropsPoliza> = {}): Poliza {
  return Poliza.reconstituir({
    id: POLIZA_ID,
    numero: 'POL-001',
    clienteId: 'c',
    aseguradoraId: 'a',
    ramoId: 'r',
    ramo: 'Vida',
    ramoCodigo: 'VIDA',
    primaTotal: '100.00',
    fechaInicio: '2026-01-31',
    fechaFin: '2026-12-31',
    estado: 'VIGENTE',
    tienePagosValidados: false,
    enMora: false,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...parcial,
  });
}

const TRES = [
  { numero: 1, valor: '33.33', fechaVencimiento: '2026-01-31' },
  { numero: 2, valor: '33.33', fechaVencimiento: '2026-02-28' },
  { numero: 3, valor: '33.34', fechaVencimiento: '2026-03-31' },
];

function dobles(p: Poliza | null = poliza()) {
  const polizas = {
    buscarPorId: jest.fn().mockResolvedValue(p),
    listarCuotas: jest.fn().mockResolvedValue([]),
    reemplazarCuotas: jest.fn().mockResolvedValue([]),
  };
  return polizas as unknown as PolizasRepositoryPort & typeof polizas;
}

describe('ObtenerPlanCuotasUseCase', () => {
  it('404 si la póliza no existe', async () => {
    await expect(
      new ObtenerPlanCuotasUseCase(dobles(null)).ejecutar(POLIZA_ID),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
  });

  it('devuelve las cuotas de la póliza', async () => {
    const repo = dobles();
    await new ObtenerPlanCuotasUseCase(repo).ejecutar(POLIZA_ID);
    expect(repo.listarCuotas).toHaveBeenCalledWith(POLIZA_ID);
  });
});

describe('DefinirPlanCuotasUseCase (HU-35, D11)', () => {
  it('reemplaza el plan de 3 cuotas que suma la prima', async () => {
    const repo = dobles();
    await new DefinirPlanCuotasUseCase(repo).ejecutar(POLIZA_ID, TRES);
    expect(repo.reemplazarCuotas).toHaveBeenCalledWith(POLIZA_ID, TRES);
  });

  it('422 PLAN_NO_CUADRA si la suma no es la prima', async () => {
    const repo = dobles();
    await expect(
      new DefinirPlanCuotasUseCase(repo).ejecutar(POLIZA_ID, [TRES[0], TRES[1]]),
    ).rejects.toMatchObject({
      detalles: { motivo: 'PLAN_NO_CUADRA', suma: '66.66', prima: '100.00' },
    });
    expect(repo.reemplazarCuotas).not.toHaveBeenCalled();
  });

  it('422 PLAN_FUERA_DE_VIGENCIA si una fecha sale de la vigencia', async () => {
    const repo = dobles();
    const fuera = [TRES[0], TRES[1], { ...TRES[2], fechaVencimiento: '2027-03-31' }];
    await expect(
      new DefinirPlanCuotasUseCase(repo).ejecutar(POLIZA_ID, fuera),
    ).rejects.toMatchObject({
      detalles: { motivo: 'PLAN_FUERA_DE_VIGENCIA' },
    });
  });

  it('422 POLIZA_NO_VIGENTE si la póliza está CANCELADA', async () => {
    const repo = dobles(poliza({ estado: 'CANCELADA' }));
    await expect(
      new DefinirPlanCuotasUseCase(repo).ejecutar(POLIZA_ID, TRES),
    ).rejects.toMatchObject({
      detalles: { motivo: 'POLIZA_NO_VIGENTE' },
    });
  });

  it('422 PLAN_CON_PAGOS_VALIDADOS si la póliza tiene un pago validado', async () => {
    const repo = dobles(poliza({ tienePagosValidados: true }));
    await expect(
      new DefinirPlanCuotasUseCase(repo).ejecutar(POLIZA_ID, TRES),
    ).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { motivo: 'PLAN_CON_PAGOS_VALIDADOS' },
    });
    expect(repo.reemplazarCuotas).not.toHaveBeenCalled();
  });

  it('404 si la póliza no existe', async () => {
    await expect(
      new DefinirPlanCuotasUseCase(dobles(null)).ejecutar(POLIZA_ID, TRES),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
  });
});
