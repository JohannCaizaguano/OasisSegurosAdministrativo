import {
  ConflictoError,
  NoEncontradoError,
  ProhibidoError,
  ValidacionError,
} from '../../../../shared-kernel/domain-error';
import type { Poliza } from '../../domain/poliza';
import type {
  ComandoActualizarPoliza,
  ComandoCrearPoliza,
  DatosActualizarPoliza,
  FiltrosPolizas,
  PaginaPolizas,
  PolizasRepositoryPort,
} from '../ports/polizas.repository.port';

/** Traduce el ramo recibido (código o nombre) al id del catálogo. */
async function resolverRamoId(polizas: PolizasRepositoryPort, ramo: string): Promise<string> {
  const encontrado = await polizas.buscarRamo(ramo);
  if (!encontrado) {
    throw new ValidacionError(`Ramo de seguro no reconocido: ${ramo}`);
  }
  return encontrado.id;
}

export class CrearPolizaUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  async ejecutar(datos: ComandoCrearPoliza): Promise<Poliza> {
    if (await this.polizas.existeNumero(datos.numero)) {
      throw new ConflictoError(`Ya existe una póliza con el número ${datos.numero}`);
    }
    const { ramo, ...resto } = datos;
    return this.polizas.crear({ ...resto, ramoId: await resolverRamoId(this.polizas, ramo) });
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

  async ejecutar(id: string, datos: ComandoActualizarPoliza): Promise<Poliza> {
    const existente = await this.polizas.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Póliza', id);
    }
    if (datos.numero && datos.numero !== existente.numero) {
      if (await this.polizas.existeNumero(datos.numero, id)) {
        throw new ConflictoError(`Ya existe una póliza con el número ${datos.numero}`);
      }
    }

    let aPersistir: DatosActualizarPoliza = datos;
    if (datos.ramo !== undefined) {
      const { ramo, ...resto } = datos;
      aPersistir = { ...resto, ramoId: await resolverRamoId(this.polizas, ramo) };
    }
    return this.polizas.actualizar(id, aPersistir);
  }
}

export class EliminarPolizaUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  async ejecutar(id: string): Promise<void> {
    const existente = await this.polizas.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Póliza', id);
    }
    await this.polizas.eliminar(id);
  }
}
