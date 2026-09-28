import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../../common/auth/decorators';
import { ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import { paginacionQuerySchema } from '@oasis/shared';
import { ListarUsuariosUseCase } from '../../application/use-cases/listar-usuarios.use-case';

@ApiTags('usuarios')
@Controller('usuarios')
@Roles('ADMIN')
export class UsuariosController {
  constructor(private readonly listarUsuarios: ListarUsuariosUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Lista usuarios del sistema (ADMIN)' })
  async listar(@ZodQuery(paginacionQuerySchema) query: { page: number; pageSize: number }) {
    const pagina = await this.listarUsuarios.ejecutar({
      pagina: query.page,
      porPagina: query.pageSize,
    });
    return {
      data: pagina.items.map((usuario) => ({
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
        clienteId: usuario.clienteId,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
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
