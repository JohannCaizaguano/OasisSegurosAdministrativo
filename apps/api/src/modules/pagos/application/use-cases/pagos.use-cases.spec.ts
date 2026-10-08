import type { EstadoPoliza } from '@oasis/shared';

import type { PagosRepositoryPort } from '../ports/pagos.repository.port';
import { CrearPagoUseCase } from './pagos.use-cases';

const POLIZA_ID = '11111111-1111-1111-1111-111111111111';

const DATOS_PAGO = {
  polizaId: POLIZA_ID,
  monto: '100.00',
  fechaPago: '2026-10-01',
  metodo: 'TRANSFERENCIA' as const,
  registradoPorId: null,
};

function crearDobles(estado: EstadoPoliza | null = 'VIGENTE') {
  const pagos: PagosRepositoryPort = {
    crear: jest.fn().mockResolvedValue({}),
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    validarYCrearRecibo: jest.fn(),
    rechazar: jest.fn(),
    buscarMetodoPago: jest.fn().mockResolvedValue({ id: 'metodo-1', codigo: 'TRANSFERENCIA' }),
    estadoPoliza: jest.fn().mockResolvedValue(estado),
  };
  return { pagos };
}

describe('CrearPagoUseCase (RN-01)', () => {
  it('404 si la póliza no existe (D14)', async () => {
    const deps = crearDobles(null);
    const caso = new CrearPagoUseCase(deps.pagos);

    await expect(caso.ejecutar(DATOS_PAGO)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
    expect(deps.pagos.buscarMetodoPago).not.toHaveBeenCalled();
    expect(deps.pagos.crear).not.toHaveBeenCalled();
  });

  it('422 POLIZA_NO_VIGENTE si la póliza está VENCIDA (D14)', async () => {
    const deps = crearDobles('VENCIDA');
    const caso = new CrearPagoUseCase(deps.pagos);

    await expect(caso.ejecutar(DATOS_PAGO)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'polizaId', motivo: 'POLIZA_NO_VIGENTE' },
    });
    expect(deps.pagos.buscarMetodoPago).not.toHaveBeenCalled();
  });

  it('422 POLIZA_NO_VIGENTE si la póliza está CANCELADA (D14)', async () => {
    const deps = crearDobles('CANCELADA');
    const caso = new CrearPagoUseCase(deps.pagos);

    await expect(caso.ejecutar(DATOS_PAGO)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'polizaId', motivo: 'POLIZA_NO_VIGENTE' },
    });
  });

  it('crea el pago con el método resuelto si la póliza está VIGENTE', async () => {
    const deps = crearDobles();
    const caso = new CrearPagoUseCase(deps.pagos);

    await caso.ejecutar(DATOS_PAGO);

    expect(deps.pagos.crear).toHaveBeenCalledWith({
      polizaId: POLIZA_ID,
      monto: '100.00',
      fechaPago: '2026-10-01',
      registradoPorId: null,
      metodoPagoId: 'metodo-1',
    });
  });
});
