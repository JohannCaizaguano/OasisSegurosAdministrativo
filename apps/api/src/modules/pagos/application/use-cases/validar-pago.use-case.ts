import type { ClockPort } from '../../../../shared-kernel/clock.port';
import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { ColaAnclajePort } from '../../../recibos/application/ports/cola-anclaje.port';
import { EmitirReciboUseCase } from '../../../recibos/application/use-cases/emitir-recibo.use-case';
import type { Pago } from '../../domain/pago';
import type { Recibo } from '../../../recibos/domain/recibo';
import type { PagosRepositoryPort } from '../ports/pagos.repository.port';

export interface ResultadoValidacion {
  pago: Pago;
  recibo: Recibo;
}

/**
 * Flujo crítico: valida el pago y emite el recibo en una única transacción de
 * base de datos. Después del commit encola el anclaje (Transactional Outbox):
 * si el proceso cae entre el commit y el encolado, el barrido del worker
 * recupera los recibos que sigan en PENDIENTE_ANCLAJE.
 */
export class ValidarPagoUseCase {
  constructor(
    private readonly pagos: PagosRepositoryPort,
    private readonly emitirRecibo: EmitirReciboUseCase,
    private readonly cola: ColaAnclajePort,
    private readonly clock: ClockPort,
  ) {}

  async ejecutar(pagoId: string, validadoPorId: string): Promise<ResultadoValidacion> {
    const pago = await this.pagos.buscarPorId(pagoId);
    if (!pago) {
      throw new NoEncontradoError('Pago', pagoId);
    }
    if (!pago.puedeValidarse()) {
      throw new ReglaNegocioError(`El pago ya está ${pago.estado.toLowerCase()}`);
    }

    const ahora = this.clock.ahora();
    const datosRecibo = this.emitirRecibo.ejecutar({
      pagoId: pago.id,
      numeroPoliza: pago.numeroPoliza ?? '',
      monto: pago.monto,
      fechaPago: pago.fechaPago,
      emitidoEn: ahora,
    });

    const resultado = await this.pagos.validarYCrearRecibo({
      pagoId: pago.id,
      validadoPorId,
      validadoEn: ahora,
      recibo: datosRecibo,
    });

    // Después del commit: encolar el anclaje (jobId = reciboId, sin duplicados).
    await this.cola.encolarAnclaje(resultado.recibo.id);

    return resultado;
  }
}
