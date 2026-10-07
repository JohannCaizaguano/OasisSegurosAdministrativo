import { ConflictoError, NoEncontradoError } from '../../../../shared-kernel/domain-error';
import type { Aseguradora } from '../../domain/aseguradora';
import type {
  AseguradorasRepositoryPort,
  DatosActualizarAseguradora,
  DatosCrearAseguradora,
  FiltrosAseguradoras,
  PaginaAseguradoras,
} from '../ports/aseguradoras.repository.port';

export class CrearAseguradoraUseCase {
  constructor(private readonly aseguradoras: AseguradorasRepositoryPort) {}

  async ejecutar(datos: DatosCrearAseguradora): Promise<Aseguradora> {
    if (await this.aseguradoras.existeRuc(datos.ruc)) {
      throw new ConflictoError('Ya existe una aseguradora con ese RUC', {
        campo: 'ruc',
        motivo: 'RUC_DUPLICADO',
      });
    }
    return this.aseguradoras.crear(datos);
  }
}

export class ListarAseguradorasUseCase {
  constructor(private readonly aseguradoras: AseguradorasRepositoryPort) {}

  ejecutar(filtros: FiltrosAseguradoras): Promise<PaginaAseguradoras> {
    return this.aseguradoras.listar(filtros);
  }
}

export class ObtenerAseguradoraUseCase {
  constructor(private readonly aseguradoras: AseguradorasRepositoryPort) {}

  async ejecutar(id: string): Promise<Aseguradora> {
    const aseguradora = await this.aseguradoras.buscarPorId(id);
    if (!aseguradora) {
      throw new NoEncontradoError('Aseguradora', id);
    }
    return aseguradora;
  }
}

export class ActualizarAseguradoraUseCase {
  constructor(private readonly aseguradoras: AseguradorasRepositoryPort) {}

  async ejecutar(id: string, datos: DatosActualizarAseguradora): Promise<Aseguradora> {
    const existente = await this.aseguradoras.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Aseguradora', id);
    }
    if (datos.ruc && datos.ruc !== existente.ruc) {
      if (await this.aseguradoras.existeRuc(datos.ruc, id)) {
        throw new ConflictoError('Ya existe una aseguradora con ese RUC', {
          campo: 'ruc',
          motivo: 'RUC_DUPLICADO',
        });
      }
    }
    return this.aseguradoras.actualizar(id, datos);
  }
}
