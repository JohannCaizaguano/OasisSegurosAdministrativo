import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { Pago } from '../../domain/pago';
import type {
  DatosCrearPago,
  FiltrosPagos,
  PaginaPagos,
  PagosRepositoryPort,
} from '../ports/pagos.repository.port';

export class CrearPagoUseCase {
  constructor(private readonly pagos: PagosRepositoryPort) {}

  ejecutar(datos: DatosCrearPago): Promise<Pago> {
    return this.pagos.crear(datos);
  }
}

export class ListarPagosUseCase {
  constructor(private readonly pagos: PagosRepositoryPort) {}

  ejecutar(filtros: FiltrosPagos): Promise<PaginaPagos> {
    return this.pagos.listar(filtros);
  }
}

export class RechazarPagoUseCase {
  constructor(private readonly pagos: PagosRepositoryPort) {}

  async ejecutar(
    pagoId: string,
    rechazadoPorId: string,
    cuando: Date,
    motivo: string,
  ): Promise<Pago> {
    const pago = await this.pagos.buscarPorId(pagoId);
    if (!pago) {
      throw new NoEncontradoError('Pago', pagoId);
    }
    if (!pago.puedeRechazarse()) {
      throw new ReglaNegocioError(`El pago ya está ${pago.estado.toLowerCase()}`);
    }
    return this.pagos.rechazar(pagoId, rechazadoPorId, cuando, motivo);
  }
}
