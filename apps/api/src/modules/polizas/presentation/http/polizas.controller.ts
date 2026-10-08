import type {
  CambiarEstadoPolizaInput,
  OrdenPoliza,
  Poliza as PolizaRespuesta,
} from '@oasis/shared';
import {
  actualizarPolizaSchema,
  cambiarEstadoPolizaSchema,
  crearPolizaSchema,
  idUuidParamSchema,
  listarPolizasQuerySchema,
} from '@oasis/shared';
import { Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import { Roles, UsuarioActual, type UsuarioAutenticado } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import {
  ActualizarPolizaUseCase,
  CambiarEstadoPolizaUseCase,
  CrearPolizaUseCase,
  ListarPolizasDeClienteUseCase,
  ListarPolizasUseCase,
  ObtenerPolizaUseCase,
} from '../../application/use-cases/polizas.use-cases';
import type { Poliza } from '../../domain/poliza';

function aRespuesta(poliza: Poliza): PolizaRespuesta {
  return {
    id: poliza.id,
    numero: poliza.numero,
    clienteId: poliza.clienteId,
    aseguradoraId: poliza.aseguradoraId,
    ramoId: poliza.ramoId,
    ramo: poliza.ramo,
    primaTotal: poliza.primaTotal,
    fechaInicio: poliza.fechaInicio,
    fechaFin: poliza.fechaFin,
    estado: poliza.estado,
    clienteNombre: poliza.clienteNombre,
    aseguradoraNombre: poliza.aseguradoraNombre,
    tienePagosValidados: poliza.tienePagosValidados,
    createdAt: poliza.createdAt,
    updatedAt: poliza.updatedAt,
  };
}

@ApiTags('polizas')
@Controller('polizas')
@Roles('ADMIN', 'OPERADOR')
export class PolizasController {
  constructor(
    private readonly crearPoliza: CrearPolizaUseCase,
    private readonly listarPolizas: ListarPolizasUseCase,
    private readonly obtenerPoliza: ObtenerPolizaUseCase,
    private readonly actualizarPoliza: ActualizarPolizaUseCase,
    private readonly cambiarEstadoPoliza: CambiarEstadoPolizaUseCase,
  ) {}

  @Post()
  @Auditar('CREAR', 'Poliza')
  @ApiOperation({ summary: 'Crea una póliza' })
  async crear(@ZodBody(crearPolizaSchema) datos: Parameters<CrearPolizaUseCase['ejecutar']>[0]) {
    return aRespuesta(await this.crearPoliza.ejecutar(datos));
  }

  @Get()
  @ApiOperation({ summary: 'Lista pólizas con filtros, orden y paginación' })
  async listar(
    @ZodQuery(listarPolizasQuerySchema)
    query: {
      page: number;
      pageSize: number;
      clienteId?: string;
      aseguradoraId?: string;
      estado?: Poliza['estado'];
      q?: string;
      orden: OrdenPoliza;
    },
  ) {
    const pagina = await this.listarPolizas.ejecutar({
      pagina: query.page,
      porPagina: query.pageSize,
      clienteId: query.clienteId,
      aseguradoraId: query.aseguradoraId,
      estado: query.estado,
      q: query.q,
      orden: query.orden,
    });
    return {
      data: pagina.items.map((poliza) => aRespuesta(poliza)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene una póliza por id' })
  async obtener(@ZodParam(idUuidParamSchema) params: { id: string }) {
    return aRespuesta(await this.obtenerPoliza.ejecutar(params.id));
  }

  @Patch(':id')
  @Auditar('MODIFICAR', 'Poliza')
  @ApiOperation({ summary: 'Actualiza una póliza vigente' })
  async actualizar(
    @ZodParam(idUuidParamSchema) params: { id: string },
    @ZodBody(actualizarPolizaSchema) datos: Parameters<ActualizarPolizaUseCase['ejecutar']>[1],
  ) {
    return aRespuesta(await this.actualizarPoliza.ejecutar(params.id, datos));
  }

  @Post(':id/estado')
  @Auditar('CAMBIAR_ESTADO', 'Poliza')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cambia el estado de una póliza vigente a VENCIDA o CANCELADA (D12)' })
  async cambiarEstado(
    @ZodParam(idUuidParamSchema) params: { id: string },
    @ZodBody(cambiarEstadoPolizaSchema) datos: CambiarEstadoPolizaInput,
  ) {
    return aRespuesta(await this.cambiarEstadoPoliza.ejecutar(params.id, datos.estado));
  }
}

@ApiTags('polizas')
@Controller('mis-polizas')
@Roles('CLIENTE')
export class MisPolizasController {
  constructor(private readonly listarPolizasDeCliente: ListarPolizasDeClienteUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Lista las pólizas del cliente autenticado' })
  async listar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @ZodQuery(listarPolizasQuerySchema)
    query: { page: number; pageSize: number; q?: string; orden: OrdenPoliza },
  ) {
    const pagina = await this.listarPolizasDeCliente.ejecutar(usuario.clienteId, {
      pagina: query.page,
      porPagina: query.pageSize,
      q: query.q,
      orden: query.orden,
    });
    return {
      data: pagina.items.map((poliza) => aRespuesta(poliza)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }
}
