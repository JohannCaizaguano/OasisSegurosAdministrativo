import { ProhibidoError } from '../../../../shared-kernel/domain-error';
import type {
  FiltrosPagos,
  PaginaPagos,
  PagosRepositoryPort,
} from '../ports/pagos.repository.port';

export class ListarPagosDeClienteUseCase {
  constructor(private readonly pagos: PagosRepositoryPort) {}

  ejecutar(
    clienteId: string | null | undefined,
    filtros: Omit<FiltrosPagos, 'clienteId'>,
  ): Promise<PaginaPagos> {
    if (!clienteId) {
      throw new ProhibidoError('El usuario no está asociado a un cliente');
    }
    return this.pagos.listar({ ...filtros, clienteId });
  }
}
