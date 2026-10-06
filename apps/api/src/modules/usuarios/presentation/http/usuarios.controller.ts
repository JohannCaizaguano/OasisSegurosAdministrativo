import type { Usuario as UsuarioRespuesta } from '@oasis/shared';
import {
  actualizarUsuarioSchema,
  crearUsuarioSchema,
  idUuidParamSchema,
  paginacionQuerySchema,
} from '@oasis/shared';
import { Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import { Roles, UsuarioActual, type UsuarioAutenticado } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import { CrearUsuarioUseCase } from '../../application/use-cases/crear-usuario.use-case';
import { DesactivarUsuarioUseCase } from '../../application/use-cases/desactivar-usuario.use-case';
import { EditarUsuarioUseCase } from '../../application/use-cases/editar-usuario.use-case';
import { ListarUsuariosUseCase } from '../../application/use-cases/listar-usuarios.use-case';
import { ReactivarUsuarioUseCase } from '../../application/use-cases/reactivar-usuario.use-case';
import { RestablecerContrasenaUseCase } from '../../application/use-cases/restablecer-contrasena.use-case';
import type { Usuario } from '../../domain/usuario';

type ParamsId = { id: string };

@ApiTags('usuarios')
@Controller('usuarios')
@Roles('ADMIN')
export class UsuariosController {
  constructor(
    private readonly listarUsuarios: ListarUsuariosUseCase,
    private readonly crearUsuario: CrearUsuarioUseCase,
    private readonly editarUsuario: EditarUsuarioUseCase,
    private readonly desactivarUsuario: DesactivarUsuarioUseCase,
    private readonly reactivarUsuario: ReactivarUsuarioUseCase,
    private readonly restablecerContrasena: RestablecerContrasenaUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista las cuentas del personal (ADMIN)' })
  async listar(@ZodQuery(paginacionQuerySchema) query: { page: number; pageSize: number }) {
    const pagina = await this.listarUsuarios.ejecutar({
      pagina: query.page,
      porPagina: query.pageSize,
    });
    return {
      data: pagina.items.map((usuario) => this.aRespuesta(usuario)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }

  @Post()
  @Auditar('CREAR', 'Usuario')
  @ApiOperation({
    summary: 'Crea un usuario del personal con contraseña temporal (ADMIN)',
    description: 'La contraseña temporal se devuelve una sola vez y no se guarda en claro.',
  })
  async crear(@ZodBody(crearUsuarioSchema) datos: Parameters<CrearUsuarioUseCase['ejecutar']>[0]) {
    const { usuario, contrasenaTemporal } = await this.crearUsuario.ejecutar(datos);
    return { usuario: this.aRespuesta(usuario), contrasenaTemporal };
  }

  @Patch(':id')
  @Auditar('MODIFICAR', 'Usuario')
  @ApiOperation({ summary: 'Edita el nombre o el rol de un usuario del personal (ADMIN)' })
  async editar(
    @ZodParam(idUuidParamSchema) params: ParamsId,
    @ZodBody(actualizarUsuarioSchema) datos: Parameters<EditarUsuarioUseCase['ejecutar']>[2],
    @UsuarioActual() actor: UsuarioAutenticado,
  ) {
    return this.aRespuesta(await this.editarUsuario.ejecutar(actor.id, params.id, datos));
  }

  @Post(':id/desactivar')
  @Auditar('DESACTIVAR', 'Usuario')
  @HttpCode(200)
  @ApiOperation({ summary: 'Desactiva un usuario y cierra todas sus sesiones (ADMIN)' })
  async desactivar(
    @ZodParam(idUuidParamSchema) params: ParamsId,
    @UsuarioActual() actor: UsuarioAutenticado,
  ) {
    return this.aRespuesta(await this.desactivarUsuario.ejecutar(actor.id, params.id));
  }

  @Post(':id/reactivar')
  @Auditar('REACTIVAR', 'Usuario')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reactiva un usuario desactivado (ADMIN)' })
  async reactivar(@ZodParam(idUuidParamSchema) params: ParamsId) {
    return this.aRespuesta(await this.reactivarUsuario.ejecutar(params.id));
  }

  @Post(':id/restablecer-contrasena')
  @Auditar('RESTABLECER_CONTRASENA', 'Usuario')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Restablece la contraseña con una temporal (ADMIN)',
    description: 'La contraseña temporal se devuelve una sola vez y no se guarda en claro.',
  })
  async restablecer(
    @ZodParam(idUuidParamSchema) params: ParamsId,
    @UsuarioActual() actor: UsuarioAutenticado,
  ) {
    return this.restablecerContrasena.ejecutar(actor.id, params.id);
  }

  private aRespuesta(usuario: Usuario): UsuarioRespuesta {
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      activo: usuario.activo,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };
  }
}
