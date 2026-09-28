import { NoEncontradoError } from '../../../../shared-kernel/domain-error';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { HasherRecibosPort } from '../ports/hasher-recibos.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';
import type { RegistroRecibosPort } from '../ports/registro-recibos.port';

export type ResultadoAnulacion = 'ANULADO_EN_CADENA' | 'SIN_CAMBIOS';

/**
 * Anulación on-chain ejecutada por el worker (idempotente):
 * si el contrato no tiene el recibo o ya está anulado, no hace nada.
 */
export class AnularReciboEnCadenaUseCase {
  constructor(
    private readonly recibos: RecibosRepositoryPort,
    private readonly registro: RegistroRecibosPort,
    private readonly hasher: HasherRecibosPort,
    private readonly cadena: ConfiguracionCadenaPort,
  ) {}

  async ejecutar(reciboId: string): Promise<ResultadoAnulacion> {
    const recibo = await this.recibos.buscarPorId(reciboId);
    if (!recibo) {
      throw new NoEncontradoError('Recibo', reciboId);
    }

    const enCadena = await this.registro.obtenerEnCadena(recibo.idOnchain);
    if (!enCadena.existe || enCadena.anulado) {
      return 'SIN_CAMBIOS';
    }

    const motivoHash = this.hasher.hashTexto(`anulacion:${recibo.id}`);
    await this.registro.anular(recibo.idOnchain, motivoHash, {
      maxFeePerGasGwei: this.cadena.maxFeePerGasGwei,
    });

    return 'ANULADO_EN_CADENA';
  }
}
