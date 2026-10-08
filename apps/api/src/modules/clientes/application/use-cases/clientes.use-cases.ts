import { normalizarIdentificacion, validarIdentificacion } from '@oasis/shared';

import {
  ConflictoError,
  NoEncontradoError,
  ReglaNegocioError,
  ValidacionError,
} from '../../../../shared-kernel/domain-error';
import type { Cliente } from '../../domain/cliente';
import type { ClientesRepositoryPort, DatosCrearCliente } from '../ports/clientes.repository.port';

export class CrearClienteUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  async ejecutar(datos: DatosCrearCliente): Promise<Cliente> {
    const duplicada = await this.clientes.existeIdentificacion(datos.identificacion);
    if (duplicada) {
      throw new ConflictoError('Ya existe un cliente con esa identificación', {
        campo: 'identificacion',
        motivo: 'IDENTIFICACION_DUPLICADA',
      });
    }
    return this.clientes.crear(datos);
  }
}

export class ListarClientesUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  ejecutar(filtros: {
    q?: string;
    tipoIdentificacion?: DatosCrearCliente['tipoIdentificacion'];
    activo?: boolean;
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

    // Si llega un solo campo, la combinación se valida contra el valor guardado (RN-11).
    let datosFinales = datos;
    if (datos.tipoIdentificacion !== undefined || datos.identificacion !== undefined) {
      const tipo = datos.tipoIdentificacion ?? existente.tipoIdentificacion;
      const identificacion = normalizarIdentificacion(
        tipo,
        datos.identificacion ?? existente.identificacion,
      );

      // D5: la identificación es la del recibo; con pólizas no se puede cambiar.
      if (
        existente.tienePolizas &&
        (tipo !== existente.tipoIdentificacion || identificacion !== existente.identificacion)
      ) {
        throw new ReglaNegocioError(
          'La identificación no se puede modificar porque el cliente tiene pólizas',
          { campo: 'identificacion', motivo: 'IDENTIFICACION_CON_POLIZAS' },
        );
      }

      const mensaje = validarIdentificacion(tipo, identificacion);
      if (mensaje) {
        throw new ValidacionError(mensaje, [{ path: ['identificacion'], message: mensaje }]);
      }
      datosFinales = { ...datos, tipoIdentificacion: tipo, identificacion };
    }

    if (datosFinales.identificacion && datosFinales.identificacion !== existente.identificacion) {
      const duplicada = await this.clientes.existeIdentificacion(datosFinales.identificacion, id);
      if (duplicada) {
        throw new ConflictoError('Ya existe un cliente con esa identificación', {
          campo: 'identificacion',
          motivo: 'IDENTIFICACION_DUPLICADA',
        });
      }
    }

    return this.clientes.actualizar(id, datosFinales);
  }
}

export class DesactivarClienteUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  async ejecutar(id: string): Promise<Cliente> {
    const existente = await this.clientes.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Cliente', id);
    }
    // Idempotente: desactivar a uno inactivo devuelve el cliente igual (D6).
    return this.clientes.actualizar(id, { activo: false });
  }
}

export class ReactivarClienteUseCase {
  constructor(private readonly clientes: ClientesRepositoryPort) {}

  async ejecutar(id: string): Promise<Cliente> {
    const existente = await this.clientes.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Cliente', id);
    }
    return this.clientes.actualizar(id, { activo: true });
  }
}
