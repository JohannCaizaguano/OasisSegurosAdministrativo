import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { Recibo } from '../../domain/recibo';
import type { ColaAnclajePort } from '../ports/cola-anclaje.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';

/** Anulación desde el API: marca el recibo y delega la anulación on-chain al worker. */
export class AnularReciboUseCase {
  constructor(
    private readonly recibos: RecibosRepositoryPort,
    private readonly cola: ColaAnclajePort,
  ) {}

  async ejecutar(reciboId: string): Promise<Recibo> {
    const recibo = await this.recibos.buscarPorId(reciboId);
    if (!recibo) {
      throw new NoEncontradoError('Recibo', reciboId);
    }
    if (recibo.estaAnulado()) {
      throw new ReglaNegocioError('El recibo ya está anulado');
    }

    const estabaAnclado = recibo.estaAnclado();
    recibo.anular();
    await this.recibos.guardar(recibo);

    if (estabaAnclado) {
      await this.cola.encolarAnulacion(recibo.id);
    }

    return recibo;
  }
}
