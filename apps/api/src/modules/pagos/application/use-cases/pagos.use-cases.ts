import {
  NoEncontradoError,
  ReglaNegocioError,
  ValidacionError,
} from '../../../../shared-kernel/domain-error';
import type { Pago } from '../../domain/pago';
import type {
  ComandoCrearPago,
  FiltrosPagos,
  PaginaPagos,
  PagosRepositoryPort,
} from '../ports/pagos.repository.port';

/** RN-01: se exige al registrar y de nuevo al validar, por si la póliza cambió entre ambos. */
export async function exigirPolizaVigente(
  pagos: PagosRepositoryPort,
  polizaId: string,
): Promise<void> {
  const estado = await pagos.estadoPoliza(polizaId);
  if (estado === null) {
    throw new NoEncontradoError('Póliza', polizaId);
  }
  if (estado !== 'VIGENTE') {
    throw new ReglaNegocioError('La póliza no está vigente y no admite pagos (RN-01)', {
      campo: 'polizaId',
      motivo: 'POLIZA_NO_VIGENTE',
    });
  }
}

export class CrearPagoUseCase {
  constructor(private readonly pagos: PagosRepositoryPort) {}

  /** D14 (RN-01): la póliza debe existir y estar VIGENTE antes de resolver el método. */
  async ejecutar(datos: ComandoCrearPago): Promise<Pago> {
    await exigirPolizaVigente(this.pagos, datos.polizaId);

    const metodo = await this.pagos.buscarMetodoPago(datos.metodo);
    if (!metodo) {
      throw new ValidacionError(`Método de pago no reconocido: ${datos.metodo}`);
    }
    const { metodo: _metodo, ...resto } = datos;
    return this.pagos.crear({ ...resto, metodoPagoId: metodo.id });
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
