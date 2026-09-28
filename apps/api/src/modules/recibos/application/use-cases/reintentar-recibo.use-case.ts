import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { Recibo } from '../../domain/recibo';
import type { ColaAnclajePort } from '../ports/cola-anclaje.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';

/** Reintento manual (ADMIN) de un recibo en FALLIDO. */
export class ReintentarReciboUseCase {
  constructor(
    private readonly recibos: RecibosRepositoryPort,
    private readonly cola: ColaAnclajePort,
  ) {}

  async ejecutar(reciboId: string): Promise<Recibo> {
    const recibo = await this.recibos.buscarPorId(reciboId);
    if (!recibo) {
      throw new NoEncontradoError('Recibo', reciboId);
    }
    if (recibo.estado !== 'FALLIDO') {
      throw new ReglaNegocioError('Solo se pueden reintentar recibos en estado FALLIDO');
    }

    recibo.reintentar();
    const guardado = await this.recibos.guardar(recibo);
    await this.cola.encolarAnclaje(recibo.id);
    return guardado;
  }
}
