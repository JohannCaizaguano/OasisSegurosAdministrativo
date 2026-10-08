import {
  NoEncontradoError,
  ProhibidoError,
  ReglaNegocioError,
  ValidacionError,
} from '../../../../shared-kernel/domain-error';
import { numeroDuplicado } from '../../domain/errores';
import type { Poliza } from '../../domain/poliza';
import type {
  DatosActualizarPoliza,
  DatosCrearPoliza,
  FiltrosPolizas,
  PaginaPolizas,
  PolizasRepositoryPort,
  RamoResumen,
} from '../ports/polizas.repository.port';

function ramoInvalido(): ReglaNegocioError {
  return new ReglaNegocioError('El ramo seleccionado no está disponible', {
    campo: 'ramoId',
    motivo: 'RAMO_INVALIDO',
  });
}

export class CrearPolizaUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  /** D9: valida cliente, aseguradora, ramo y número, en ese orden. */
  async ejecutar(datos: DatosCrearPoliza): Promise<Poliza> {
    const cliente = await this.polizas.buscarClienteParaPoliza(datos.clienteId);
    if (!cliente) {
      throw new NoEncontradoError('Cliente', datos.clienteId);
    }
    if (!cliente.activo) {
      throw new ReglaNegocioError('El cliente está inactivo y no admite pólizas nuevas', {
        campo: 'clienteId',
        motivo: 'CLIENTE_INACTIVO',
      });
    }
    if (!(await this.polizas.existeAseguradora(datos.aseguradoraId))) {
      throw new NoEncontradoError('Aseguradora', datos.aseguradoraId);
    }
    if (!(await this.polizas.buscarRamoActivoPorId(datos.ramoId))) {
      throw ramoInvalido();
    }
    if (await this.polizas.existeNumero(datos.numero)) {
      throw numeroDuplicado(datos.numero);
    }
    return this.polizas.crear(datos);
  }
}

export class ListarPolizasUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  ejecutar(filtros: FiltrosPolizas): Promise<PaginaPolizas> {
    return this.polizas.listar(filtros);
  }
}

export class ListarPolizasDeClienteUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  ejecutar(
    clienteId: string | null | undefined,
    filtros: Omit<FiltrosPolizas, 'clienteId'>,
  ): Promise<PaginaPolizas> {
    if (!clienteId) {
      throw new ProhibidoError('El usuario no está asociado a un cliente');
    }
    return this.polizas.listar({ ...filtros, clienteId });
  }
}

export class ObtenerPolizaUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  async ejecutar(id: string): Promise<Poliza> {
    const poliza = await this.polizas.buscarPorId(id);
    if (!poliza) {
      throw new NoEncontradoError('Póliza', id);
    }
    return poliza;
  }
}

export class ActualizarPolizaUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  /** D11: solo pólizas VIGENTES; prima fija con pagos validados; fechas coherentes. */
  async ejecutar(id: string, datos: DatosActualizarPoliza): Promise<Poliza> {
    const existente = await this.polizas.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Póliza', id);
    }
    if (existente.estado !== 'VIGENTE') {
      throw new ReglaNegocioError('Solo una póliza vigente puede editarse', {
        campo: 'estado',
        motivo: 'POLIZA_NO_VIGENTE',
      });
    }

    // La prima solo viaja si cambia: así el repositorio exige "sin pagos validados" únicamente entonces.
    const { primaTotal, ...resto } = datos;
    const primaCambia =
      primaTotal !== undefined && Number(primaTotal) !== Number(existente.primaTotal);
    if (primaCambia && existente.tienePagosValidados) {
      throw new ReglaNegocioError(
        'La prima no se puede modificar porque la póliza tiene pagos validados',
        { campo: 'primaTotal', motivo: 'PRIMA_CON_PAGOS_VALIDADOS' },
      );
    }

    // Si llega una sola fecha, se compara con la guardada.
    const fechaInicio = datos.fechaInicio ?? existente.fechaInicio;
    const fechaFin = datos.fechaFin ?? existente.fechaFin;
    if (fechaFin <= fechaInicio) {
      throw new ValidacionError('La fecha de fin debe ser posterior a la de inicio', [
        { path: ['fechaFin'], message: 'La fecha de fin debe ser posterior a la de inicio' },
      ]);
    }

    // Mismo orden que al crear (D9). Solo se valida lo que cambia: un ramo o una aseguradora
    // retirados del catálogo no deben impedir editar otros campos de una póliza vieja.
    if (
      datos.aseguradoraId !== undefined &&
      datos.aseguradoraId !== existente.aseguradoraId &&
      !(await this.polizas.existeAseguradora(datos.aseguradoraId))
    ) {
      throw new NoEncontradoError('Aseguradora', datos.aseguradoraId);
    }
    if (
      datos.ramoId !== undefined &&
      datos.ramoId !== existente.ramoId &&
      !(await this.polizas.buscarRamoActivoPorId(datos.ramoId))
    ) {
      throw ramoInvalido();
    }
    if (
      datos.numero !== undefined &&
      datos.numero !== existente.numero &&
      (await this.polizas.existeNumero(datos.numero, id))
    ) {
      throw numeroDuplicado(datos.numero);
    }

    return this.polizas.actualizar(id, primaCambia ? { ...resto, primaTotal } : resto);
  }
}

export class CambiarEstadoPolizaUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  /** D12: VIGENTE → VENCIDA o CANCELADA; ambos terminales. */
  async ejecutar(id: string, estado: 'VENCIDA' | 'CANCELADA'): Promise<Poliza> {
    const poliza = await this.polizas.buscarPorId(id);
    if (!poliza) {
      throw new NoEncontradoError('Póliza', id);
    }
    if (poliza.estado !== 'VIGENTE') {
      throw new ReglaNegocioError('Solo una póliza vigente puede cambiar de estado', {
        campo: 'estado',
        motivo: 'POLIZA_NO_VIGENTE',
      });
    }
    return this.polizas.cambiarEstado(id, estado);
  }
}

export class ListarRamosUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  ejecutar(): Promise<RamoResumen[]> {
    return this.polizas.listarRamosActivos();
  }
}
