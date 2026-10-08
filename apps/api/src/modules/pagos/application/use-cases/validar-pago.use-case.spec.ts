import type { EstadoPoliza } from '@oasis/shared';

import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { ColaAnclajePort } from '../../../recibos/application/ports/cola-anclaje.port';
import type { EmitirReciboUseCase } from '../../../recibos/application/use-cases/emitir-recibo.use-case';
import { Pago } from '../../domain/pago';
import type { PagosRepositoryPort } from '../ports/pagos.repository.port';
import { ValidarPagoUseCase } from './validar-pago.use-case';

const PAGO = Pago.reconstituir({
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
  motivoRechazo: null,
  nota: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

function crearDobles(estadoPoliza: EstadoPoliza) {
  const pagos = {
    buscarPorId: jest.fn().mockResolvedValue(PAGO),
    estadoPoliza: jest.fn().mockResolvedValue(estadoPoliza),
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
