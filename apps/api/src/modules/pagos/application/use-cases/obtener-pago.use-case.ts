import { NoEncontradoError } from '../../../../shared-kernel/domain-error';
import type { DetallePago, PagosRepositoryPort } from '../ports/pagos.repository.port';

export class ObtenerPagoUseCase {
  constructor(private readonly pagos: PagosRepositoryPort) {}

  async ejecutar(id: string): Promise<DetallePago> {
    const detalle = await this.pagos.buscarDetalle(id);
    if (!detalle) {
      throw new NoEncontradoError('Pago', id);
    }
    return detalle;
  }
}
