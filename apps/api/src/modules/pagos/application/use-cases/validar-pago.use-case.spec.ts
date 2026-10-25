import type { EstadoPoliza } from '@oasis/shared';

import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { ColaAnclajePort } from '../../../recibos/application/ports/cola-anclaje.port';
import type { EmitirReciboUseCase } from '../../../recibos/application/use-cases/emitir-recibo.use-case';
import { Pago, type PropsPago } from '../../domain/pago';
import type { PagosRepositoryPort } from '../ports/pagos.repository.port';
import { ValidarPagoUseCase } from './validar-pago.use-case';

const PROPS: PropsPago = {
  id: '22222222-2222-2222-2222-222222222222',
  polizaId: '11111111-1111-1111-1111-111111111111',
  numeroPoliza: 'POL-1',
  monto: '100.00',
  fechaPago: '2026-10-01',
  metodoPagoId: 'metodo-1',
  metodo: 'TRANSFERENCIA',
  referencia: null,
  estado: 'REGISTRADO',
  registradoPorId: null,
  validadoPorId: null,
  validadoEn: null,
  rechazadoPorId: null,
  rechazadoEn: null,
  motivoRechazo: null,
  nota: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};
const PAGO = Pago.reconstituir(PROPS);

function crearDobles(estadoPoliza: EstadoPoliza, saldo = '380.50', pago: Pago = PAGO) {
  const pagos = {
    buscarPorId: jest.fn().mockResolvedValue(pago),
    estadoPoliza: jest.fn().mockResolvedValue(estadoPoliza),
    saldoPoliza: jest.fn().mockResolvedValue(saldo),
    validarYCrearRecibo: jest.fn().mockResolvedValue({ pago: PAGO, recibo: { id: 'recibo-1' } }),
  };
  const emitir = { ejecutar: jest.fn().mockReturnValue({}) };
  const cola = { encolarAnclaje: jest.fn() };
  const clock: ClockPort = { ahora: () => new Date('2026-10-02T00:00:00.000Z') };
  const caso = new ValidarPagoUseCase(
    pagos as unknown as PagosRepositoryPort,
    emitir as unknown as EmitirReciboUseCase,
    cola as unknown as ColaAnclajePort,
    clock,
  );
  return { caso, pagos, cola };
}

describe('ValidarPagoUseCase (RN-01 al validar)', () => {
  it('rechaza validar un pago de una póliza que ya no está vigente', async () => {
    const { caso, pagos, cola } = crearDobles('CANCELADA');

    await expect(caso.ejecutar(PAGO.id, 'usuario-1')).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'polizaId', motivo: 'POLIZA_NO_VIGENTE' },
    });
    expect(pagos.validarYCrearRecibo).not.toHaveBeenCalled();
    expect(cola.encolarAnclaje).not.toHaveBeenCalled();
  });

  it('valida y encola el anclaje si la póliza sigue vigente', async () => {
    const { caso, pagos, cola } = crearDobles('VIGENTE');

    await caso.ejecutar(PAGO.id, 'usuario-1');

    expect(pagos.validarYCrearRecibo).toHaveBeenCalledTimes(1);
    expect(cola.encolarAnclaje).toHaveBeenCalledWith('recibo-1');
  });
});

describe('ValidarPagoUseCase (RN-02 y RN-03 al validar)', () => {
  it('422 MONTO_SUPERA_SALDO si otro pago validado antes dejó la póliza sin saldo', async () => {
    const { caso, pagos, cola } = crearDobles('VIGENTE', '50.00');

    await expect(caso.ejecutar(PAGO.id, 'usuario-1')).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'monto', motivo: 'MONTO_SUPERA_SALDO', saldo: '50.00' },
    });
    expect(pagos.validarYCrearRecibo).not.toHaveBeenCalled();
    expect(cola.encolarAnclaje).not.toHaveBeenCalled();
  });

  it('valida un pago cuyo monto es exactamente el saldo', async () => {
    const { caso, pagos } = crearDobles('VIGENTE', '100.00');

    await caso.ejecutar(PAGO.id, 'usuario-1');

    expect(pagos.validarYCrearRecibo).toHaveBeenCalledTimes(1);
  });

  it.each(['VALIDADO', 'RECHAZADO'] as const)('422 si el pago está %s (RN-03)', async (estado) => {
    const pago = Pago.reconstituir({ ...PROPS, estado });
    const { caso, pagos } = crearDobles('VIGENTE', '380.50', pago);

    await expect(caso.ejecutar(PAGO.id, 'usuario-1')).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
    });
    expect(pagos.estadoPoliza).not.toHaveBeenCalled();
    expect(pagos.validarYCrearRecibo).not.toHaveBeenCalled();
  });
});
