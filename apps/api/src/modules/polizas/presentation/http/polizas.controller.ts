import type { Poliza as PolizaRespuesta } from '@oasis/shared';
import {
  actualizarPolizaSchema,
  crearPolizaSchema,
  idUuidParamSchema,
  listarPolizasQuerySchema,
} from '@oasis/shared';
import { Controller, Delete, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles, UsuarioActual, type UsuarioAutenticado } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import {
  ActualizarPolizaUseCase,
  CrearPolizaUseCase,
  EliminarPolizaUseCase,
  ListarPolizasDeClienteUseCase,
  ListarPolizasUseCase,
  ObtenerPolizaUseCase,
} from '../../application/use-cases/polizas.use-cases';
import type { Poliza } from '../../domain/poliza';

@ApiTags('polizas')
@Controller('polizas')
@Roles('ADMIN', 'OPERADOR')
export class PolizasController {
  constructor(
    private readonly crearPoliza: CrearPolizaUseCase,
    private readonly listarPolizas: ListarPolizasUseCase,
    private readonly obtenerPoliza: ObtenerPolizaUseCase,
    private readonly actualizarPoliza: ActualizarPolizaUseCase,
    private readonly eliminarPoliza: EliminarPolizaUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea una póliza' })
  async crear(@ZodBody(crearPolizaSchema) datos: Parameters<CrearPolizaUseCase['ejecutar']>[0]) {
    return this.aRespuesta(await this.crearPoliza.ejecutar(datos));
  }

  @Get()
  @ApiOperation({ summary: 'Lista pólizas con filtros y paginación' })
  async listar(
    @ZodQuery(listarPolizasQuerySchema)
    query: {
      page: number;
      pageSize: number;
      clienteId?: string;
      estado?: Poliza['estado'];
      q?: string;
    },
  ) {
    const pagina = await this.listarPolizas.ejecutar({
      pagina: query.page,
      porPagina: query.pageSize,
      clienteId: query.clienteId,
      estado: query.estado,
      q: query.q,
    });
    return {
      data: pagina.items.map((poliza) => this.aRespuesta(poliza)),
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
    return this.aRespuesta(await this.obtenerPoliza.ejecutar(params.id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una póliza' })
  async actualizar(
    @ZodParam(idUuidParamSchema) params: { id: string },
    @ZodBody(actualizarPolizaSchema) datos: Parameters<ActualizarPolizaUseCase['ejecutar']>[1],
  ) {
    return this.aRespuesta(await this.actualizarPoliza.ejecutar(params.id, datos));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Elimina una póliza sin pagos' })
  async eliminar(@ZodParam(idUuidParamSchema) params: { id: string }): Promise<void> {
    await this.eliminarPoliza.ejecutar(params.id);
  }

  private aRespuesta(poliza: Poliza): PolizaRespuesta {
    return {
      id: poliza.id,
      numero: poliza.numero,
      clienteId: poliza.clienteId,
      aseguradoraId: poliza.aseguradoraId,
      ramo: poliza.ramo,
      primaTotal: poliza.primaTotal,
      fechaInicio: poliza.fechaInicio,
      fechaFin: poliza.fechaFin,
      estado: poliza.estado,
      clienteNombre: poliza.clienteNombre,
      aseguradoraNombre: poliza.aseguradoraNombre,
      createdAt: poliza.createdAt,
      updatedAt: poliza.updatedAt,
    };
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
    @ZodQuery(listarPolizasQuerySchema) query: { page: number; pageSize: number; q?: string },
  ) {
    const pagina = await this.listarPolizasDeCliente.ejecutar(usuario.clienteId, {
      pagina: query.page,
      porPagina: query.pageSize,
      q: query.q,
    });
    return {
      data: pagina.items.map((poliza) => ({
        id: poliza.id,
        numero: poliza.numero,
        clienteId: poliza.clienteId,
        aseguradoraId: poliza.aseguradoraId,
        ramo: poliza.ramo,
        primaTotal: poliza.primaTotal,
        fechaInicio: poliza.fechaInicio,
        fechaFin: poliza.fechaFin,
        estado: poliza.estado,
        aseguradoraNombre: poliza.aseguradoraNombre,
        createdAt: poliza.createdAt,
        updatedAt: poliza.updatedAt,
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }
}
