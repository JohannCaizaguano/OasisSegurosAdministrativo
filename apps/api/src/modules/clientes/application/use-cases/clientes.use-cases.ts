import { ConflictoError, NoEncontradoError } from '../../../../shared-kernel/domain-error';
import type { Cliente } from '../../domain/cliente';
import type { ClientesRepositoryPort, DatosCrearCliente } from '../ports/clientes.repository.port';

export class CrearClienteUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  async ejecutar(datos: DatosCrearCliente): Promise<Cliente> {
    const duplicada = await this.clientes.existeIdentificacion(datos.identificacion);
    if (duplicada) {
      throw new ConflictoError(
        `Ya existe un cliente con la identificación ${datos.identificacion}`,
      );
    }
    return this.clientes.crear(datos);
  }
}

export class ListarClientesUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  ejecutar(filtros: {
    q?: string;
    tipoIdentificacion?: DatosCrearCliente['tipoIdentificacion'];
    pagina: number;
    porPagina: number;
  }) {
    return this.clientes.listar(filtros);
  }
}

export class ObtenerClienteUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  async ejecutar(id: string): Promise<Cliente> {
    const cliente = await this.clientes.buscarPorId(id);
    if (!cliente) {
      throw new NoEncontradoError('Cliente', id);
    }
    return cliente;
  }
}

export class ActualizarClienteUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  async ejecutar(id: string, datos: Partial<DatosCrearCliente>): Promise<Cliente> {
    const existente = await this.clientes.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Cliente', id);
    }
    if (datos.identificacion && datos.identificacion !== existente.identificacion) {
      const duplicada = await this.clientes.existeIdentificacion(datos.identificacion, id);
      if (duplicada) {
        throw new ConflictoError(
          `Ya existe un cliente con la identificación ${datos.identificacion}`,
        );
      }
    }
    return this.clientes.actualizar(id, datos);
  }
}

export class EliminarClienteUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  async ejecutar(id: string): Promise<void> {
    const existente = await this.clientes.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Cliente', id);
    }
    await this.clientes.eliminar(id);
  }
}
