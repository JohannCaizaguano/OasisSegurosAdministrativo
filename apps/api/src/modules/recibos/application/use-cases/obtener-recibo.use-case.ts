import { NoEncontradoError } from '../../../../shared-kernel/domain-error';
import type { Recibo } from '../../domain/recibo';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';

export class ObtenerReciboUseCase {
  constructor(private readonly recibos: RecibosRepositoryPort) {}

  async ejecutar(id: string): Promise<Recibo> {
    const recibo = await this.recibos.buscarPorId(id);
    if (!recibo) {
      throw new NoEncontradoError('Recibo', id);
    }
    return recibo;
  }
}
