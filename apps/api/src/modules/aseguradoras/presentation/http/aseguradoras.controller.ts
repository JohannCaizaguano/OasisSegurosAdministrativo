import type { Aseguradora as AseguradoraRespuesta } from '@oasis/shared';
import {
  actualizarAseguradoraSchema,
  crearAseguradoraSchema,
  idUuidParamSchema,
  listarAseguradorasQuerySchema,
} from '@oasis/shared';
import { Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import { Roles } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import {
  ActualizarAseguradoraUseCase,
  CrearAseguradoraUseCase,
  ListarAseguradorasUseCase,
  ObtenerAseguradoraUseCase,
} from '../../application/use-cases/aseguradoras.use-cases';
import type { Aseguradora } from '../../domain/aseguradora';

@ApiTags('aseguradoras')
@Controller('aseguradoras')
export class AseguradorasController {
  constructor(
    private readonly crearAseguradora: CrearAseguradoraUseCase,
    private readonly listarAseguradoras: ListarAseguradorasUseCase,
    private readonly obtenerAseguradora: ObtenerAseguradoraUseCase,
    private readonly actualizarAseguradora: ActualizarAseguradoraUseCase,
  ) {}

  @Post()
  @Roles('ADMIN')
  @Auditar('CREAR', 'Aseguradora')
  @ApiOperation({ summary: 'Crea una aseguradora (ADMIN)' })
  async crear(@ZodBody(crearAseguradoraSchema) datos: { nombre: string; ruc: string }) {
    return this.aRespuesta(await this.crearAseguradora.ejecutar(datos));
  }

  @Get()
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Lista aseguradoras' })
  async listar(
    @ZodQuery(listarAseguradorasQuerySchema) query: { page: number; pageSize: number; q?: string },
  ) {
    const pagina = await this.listarAseguradoras.ejecutar({
      pagina: query.page,
      porPagina: query.pageSize,
      q: query.q,
    });
    return {
      data: pagina.items.map((aseguradora) => this.aRespuesta(aseguradora)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Obtiene una aseguradora por id' })
  async obtener(@ZodParam(idUuidParamSchema) params: { id: string }) {
    return this.aRespuesta(await this.obtenerAseguradora.ejecutar(params.id));
  }

  @Patch(':id')
  @Roles('ADMIN')
  @Auditar('MODIFICAR', 'Aseguradora')
  @ApiOperation({ summary: 'Actualiza una aseguradora (ADMIN)' })
  async actualizar(
    @ZodParam(idUuidParamSchema) params: { id: string },
    @ZodBody(actualizarAseguradoraSchema) datos: { nombre?: string; ruc?: string },
  ) {
    return this.aRespuesta(await this.actualizarAseguradora.ejecutar(params.id, datos));
  }

  private aRespuesta(aseguradora: Aseguradora): AseguradoraRespuesta {
    return {
      id: aseguradora.id,
      nombre: aseguradora.nombre,
      ruc: aseguradora.ruc,
      createdAt: aseguradora.createdAt,
      updatedAt: aseguradora.updatedAt,
    };
  }
}
