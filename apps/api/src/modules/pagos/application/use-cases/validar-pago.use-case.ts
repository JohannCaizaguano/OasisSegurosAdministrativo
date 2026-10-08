import type { ClockPort } from '../../../../shared-kernel/clock.port';
import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { ColaAnclajePort } from '../../../recibos/application/ports/cola-anclaje.port';
import { EmitirReciboUseCase } from '../../../recibos/application/use-cases/emitir-recibo.use-case';
import type { Pago } from '../../domain/pago';
import type { Recibo } from '../../../recibos/domain/recibo';
import type { PagosRepositoryPort } from '../ports/pagos.repository.port';
import { exigirPolizaVigente } from './pagos.use-cases';

export interface ResultadoValidacion {
  pago: Pago;
  recibo: Recibo;
}

/**
 * Flujo crítico: valida el pago y emite el recibo en una única transacción;
 * tras el commit encola el anclaje (Transactional Outbox).
 */
export class ValidarPagoUseCase {
  constructor(
    private readonly pagos: PagosRepositoryPort,
    private readonly emitirRecibo: EmitirReciboUseCase,
    private readonly cola: ColaAnclajePort,
    private readonly clock: ClockPort,
  ) {}

  async ejecutar(
    pagoId: string,
    validadoPorId: string,
    nota?: string | null,
  ): Promise<ResultadoValidacion> {
    const pago = await this.pagos.buscarPorId(pagoId);
    if (!pago) {
      throw new NoEncontradoError('Pago', pagoId);
    }
    if (!pago.puedeValidarse()) {
      throw new ReglaNegocioError(`El pago ya está ${pago.estado.toLowerCase()}`);
    }

    await exigirPolizaVigente(this.pagos, pago.polizaId);

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
      nota: nota ?? null,
      recibo: datosRecibo,
    });

    // Después del commit: encolar el anclaje (jobId = reciboId, sin duplicados).
    await this.cola.encolarAnclaje(resultado.recibo.id);

    return resultado;
  }
}
