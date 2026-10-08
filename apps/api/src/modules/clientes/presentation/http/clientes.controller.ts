import type { Cliente as ClienteRespuesta, FiltroEstadoCliente } from '@oasis/shared';
import {
  actualizarClienteSchema,
  crearClienteSchema,
  idUuidParamSchema,
  listarClientesQuerySchema,
} from '@oasis/shared';
import { Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import { Roles } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import {
  ActualizarClienteUseCase,
  CrearClienteUseCase,
  DesactivarClienteUseCase,
  ListarClientesUseCase,
  ObtenerClienteUseCase,
  ReactivarClienteUseCase,
} from '../../application/use-cases/clientes.use-cases';
import type { Cliente } from '../../domain/cliente';

type ParamsId = { id: string };

@ApiTags('clientes')
@Controller('clientes')
@Roles('ADMIN', 'OPERADOR')
export class ClientesController {
  constructor(
    private readonly crearCliente: CrearClienteUseCase,
    private readonly listarClientes: ListarClientesUseCase,
    private readonly obtenerCliente: ObtenerClienteUseCase,
    private readonly actualizarCliente: ActualizarClienteUseCase,
    private readonly desactivarCliente: DesactivarClienteUseCase,
    private readonly reactivarCliente: ReactivarClienteUseCase,
  ) {}

  @Post()
  @Auditar('CREAR', 'Cliente')
  @ApiOperation({ summary: 'Crea un cliente' })
  async crear(@ZodBody(crearClienteSchema) datos: Parameters<CrearClienteUseCase['ejecutar']>[0]) {
    return this.aRespuesta(await this.crearCliente.ejecutar(datos));
  }

  @Get()
  @ApiOperation({ summary: 'Lista clientes con búsqueda y paginación' })
  async listar(
    @ZodQuery(listarClientesQuerySchema) query: { pagina?: unknown } & Record<string, unknown>,
  ) {
    const { page, pageSize, q, tipoIdentificacion, estado } = query as {
      page: number;
      pageSize: number;
      q?: string;
      tipoIdentificacion?: Cliente['tipoIdentificacion'];
      estado: FiltroEstadoCliente;
    };
    const pagina = await this.listarClientes.ejecutar({
      pagina: page,
      porPagina: pageSize,
      q,
      tipoIdentificacion,
      // D8: `estado` se traduce a `activo`; TODOS no filtra.
      activo: estado === 'TODOS' ? undefined : estado === 'ACTIVOS',
    });
    return {
      data: pagina.items.map((cliente) => this.aRespuesta(cliente)),
      meta: {
        page,
        pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / pageSize),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un cliente por id' })
  async obtener(@ZodParam(idUuidParamSchema) params: ParamsId) {
    return this.aRespuesta(await this.obtenerCliente.ejecutar(params.id));
  }

  @Patch(':id')
  @Auditar('MODIFICAR', 'Cliente')
  @ApiOperation({ summary: 'Actualiza un cliente' })
  async actualizar(
    @ZodParam(idUuidParamSchema) params: ParamsId,
    @ZodBody(actualizarClienteSchema)
    datos: Parameters<ActualizarClienteUseCase['ejecutar']>[1],
  ) {
    return this.aRespuesta(await this.actualizarCliente.ejecutar(params.id, datos));
  }

  @Post(':id/desactivar')
  @Auditar('DESACTIVAR', 'Cliente')
  @HttpCode(200)
  @ApiOperation({ summary: 'Desactiva un cliente sin borrar su historial (D6)' })
  async desactivar(@ZodParam(idUuidParamSchema) params: ParamsId) {
    return this.aRespuesta(await this.desactivarCliente.ejecutar(params.id));
  }

  @Post(':id/reactivar')
  @Auditar('REACTIVAR', 'Cliente')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reactiva un cliente desactivado (D6)' })
  async reactivar(@ZodParam(idUuidParamSchema) params: ParamsId) {
    return this.aRespuesta(await this.reactivarCliente.ejecutar(params.id));
  }

  private aRespuesta(cliente: Cliente): ClienteRespuesta {
    return {
      id: cliente.id,
      tipoIdentificacion: cliente.tipoIdentificacion,
      identificacion: cliente.identificacion,
      nombres: cliente.nombres ?? undefined,
      apellidos: cliente.apellidos ?? undefined,
      razonSocial: cliente.razonSocial ?? undefined,
      email: cliente.email,
      telefono: cliente.telefono ?? undefined,
      activo: cliente.activo,
      tienePolizas: cliente.tienePolizas,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    };
  }
}
