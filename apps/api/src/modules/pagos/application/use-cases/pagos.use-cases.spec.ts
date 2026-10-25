import type { EstadoPoliza } from '@oasis/shared';

import type { PagosRepositoryPort } from '../ports/pagos.repository.port';
import { Pago, type PropsPago } from '../../domain/pago';
import { CrearPagoUseCase, RechazarPagoUseCase } from './pagos.use-cases';

const POLIZA_ID = '11111111-1111-1111-1111-111111111111';

const DATOS_PAGO = {
  polizaId: POLIZA_ID,
  monto: '100.00',
  fechaPago: '2026-10-01',
  metodo: 'TRANSFERENCIA' as const,
  referencia: 'TRX-1',
  registradoPorId: 'operador-1',
};

function crearDobles(estado: EstadoPoliza | null = 'VIGENTE', saldo: string | null = '518.40') {
  const pagos: PagosRepositoryPort = {
    crear: jest.fn().mockResolvedValue({}),
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    validarYCrearRecibo: jest.fn(),
    rechazar: jest.fn(),
    buscarMetodoPago: jest.fn().mockResolvedValue({ id: 'metodo-1', codigo: 'TRANSFERENCIA' }),
    estadoPoliza: jest.fn().mockResolvedValue(estado),
    saldoPoliza: jest.fn().mockResolvedValue(saldo),
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
      referencia: 'TRX-1',
      registradoPorId: 'operador-1',
      metodoPagoId: 'metodo-1',
    });
  });
});

describe('CrearPagoUseCase (RN-02, D7)', () => {
  it('422 MONTO_SUPERA_SALDO con el saldo si el monto lo supera', async () => {
    const deps = crearDobles('VIGENTE', '518.40');
    const caso = new CrearPagoUseCase(deps.pagos);

    await expect(caso.ejecutar({ ...DATOS_PAGO, monto: '518.41' })).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'monto', motivo: 'MONTO_SUPERA_SALDO', saldo: '518.40' },
    });
    expect(deps.pagos.crear).not.toHaveBeenCalled();
  });

  it('acepta un monto exactamente igual al saldo', async () => {
    const deps = crearDobles('VIGENTE', '518.40');
    const caso = new CrearPagoUseCase(deps.pagos);

    await caso.ejecutar({ ...DATOS_PAGO, monto: '518.4' });

    expect(deps.pagos.crear).toHaveBeenCalledTimes(1);
  });

  it('exige RN-01 antes que RN-02', async () => {
    const deps = crearDobles('VENCIDA');
    const caso = new CrearPagoUseCase(deps.pagos);

    await expect(caso.ejecutar(DATOS_PAGO)).rejects.toMatchObject({
      detalles: { motivo: 'POLIZA_NO_VIGENTE' },
    });
    expect(deps.pagos.saldoPoliza).not.toHaveBeenCalled();
  });
});

function pagoEn(estado: PropsPago['estado']): Pago {
  return Pago.reconstituir({
    id: '22222222-2222-2222-2222-222222222222',
    polizaId: POLIZA_ID,
    monto: '100.00',
    fechaPago: '2026-10-01',
    metodoPagoId: 'metodo-1',
    metodo: 'TRANSFERENCIA',
    referencia: 'TRX-1',
    estado,
    registradoPorId: null,
    validadoPorId: null,
    validadoEn: null,
    rechazadoPorId: null,
    rechazadoEn: null,
    motivoRechazo: null,
    nota: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  });
}

describe('RechazarPagoUseCase (HU-19)', () => {
  it('rechaza un pago REGISTRADO con el autor y la fecha del rechazo', async () => {
    const deps = crearDobles();
    jest.mocked(deps.pagos.buscarPorId).mockResolvedValue(pagoEn('REGISTRADO'));
    const cuando = new Date('2026-10-02T10:00:00.000Z');

    await new RechazarPagoUseCase(deps.pagos).ejecutar(
      'p1',
      'operador-1',
      cuando,
      'Pago duplicado',
    );

    expect(deps.pagos.rechazar).toHaveBeenCalledWith('p1', 'operador-1', cuando, 'Pago duplicado');
  });

  it.each(['VALIDADO', 'RECHAZADO'] as const)(
    '422 si el pago ya está %s (final)',
    async (estado) => {
      const deps = crearDobles();
      jest.mocked(deps.pagos.buscarPorId).mockResolvedValue(pagoEn(estado));

      await expect(
        new RechazarPagoUseCase(deps.pagos).ejecutar('p1', 'u', new Date(), 'Pago duplicado'),
      ).rejects.toMatchObject({ codigo: 'REGLA_NEGOCIO' });
      expect(deps.pagos.rechazar).not.toHaveBeenCalled();
    },
  );
});
