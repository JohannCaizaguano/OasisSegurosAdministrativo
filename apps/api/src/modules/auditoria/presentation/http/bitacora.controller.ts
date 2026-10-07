import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ListarBitacoraQuery, RegistroBitacora, RespuestaPaginada } from '@oasis/shared';
import { listarBitacoraQuerySchema } from '@oasis/shared';

import { Roles } from '../../../../common/auth/decorators';
import { ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import {
  ListarBitacoraUseCase,
  ListarUsuariosBitacoraUseCase,
} from '../../application/use-cases/auditoria.use-cases';

@ApiTags('auditoria')
@Controller('bitacora')
@Roles('ADMIN')
export class BitacoraController {
  constructor(
    private readonly listarBitacora: ListarBitacoraUseCase,
    private readonly listarUsuariosBitacora: ListarUsuariosBitacoraUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consulta la bitácora de auditoría con filtros (ADMIN)' })
  async listar(
    @ZodQuery(listarBitacoraQuerySchema) query: ListarBitacoraQuery,
  ): Promise<RespuestaPaginada<RegistroBitacora>> {
    const pagina = await this.listarBitacora.ejecutar({
      pagina: query.page,
      porPagina: query.pageSize,
      usuarioId: query.usuarioId,
      accion: query.accion,
      desde: query.desde,
      hasta: query.hasta,
    });
    return {
      data: pagina.items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }

  @Get('usuarios')
  @ApiOperation({ summary: 'Lista los usuarios que aparecen en la bitácora (ADMIN)' })
  async usuarios() {
    return this.listarUsuariosBitacora.ejecutar();
  }
}
