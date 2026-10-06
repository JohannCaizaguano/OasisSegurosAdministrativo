import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { LoginInput, LoginResponse, UsuarioSesion } from '@oasis/shared';
import { loginSchema, ROLES } from '@oasis/shared';
import type { CambiarContrasenaInput } from '@oasis/shared';
import { cambiarContrasenaSchema } from '@oasis/shared';

import { NoAutorizadoError } from '../../../../shared-kernel/domain-error';
import { limitesThrottle } from '../../../../config/throttle';
import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import {
  Public,
  Roles,
  UsuarioActual,
  type UsuarioAutenticado,
} from '../../../../common/auth/decorators';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';
import { CerrarSesionUseCase } from '../../application/use-cases/cerrar-sesion.use-case';
import { CambiarContrasenaUseCase } from '../../application/use-cases/cambiar-contrasena.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { ObtenerSesionUseCase } from '../../application/use-cases/obtener-sesion.use-case';
import { RefrescarSesionUseCase } from '../../application/use-cases/refrescar-sesion.use-case';
import type { UsuarioCredenciales } from '../../domain/usuario-credenciales';

export const REFRESH_COOKIE = 'oasis_refresh';
const RUTA_COOKIE = '/api/v1/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refrescar: RefrescarSesionUseCase,
    private readonly cerrar: CerrarSesionUseCase,
    private readonly sesion: ObtenerSesionUseCase,
    private readonly cambiar: CambiarContrasenaUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: limitesThrottle().login, ttl: 60_000 } })
  @Post('login')
  @Auditar('INICIAR_SESION', 'Usuario')
  @HttpCode(200)
  @ApiOperation({ summary: 'Inicia sesión y entrega un access token + cookie de refresh' })
  async iniciarSesion(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() peticion: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<LoginResponse> {
    const { usuario, tokens } = await this.login.ejecutar(input.email, input.password);
    this.escribirCookie(peticion, respuesta, tokens.refreshToken, tokens.familia.expiraEn);
    return { accessToken: tokens.accessToken, usuario: this.aSesion(usuario) };
  }

  @Public()
  @Throttle({ default: { limit: limitesThrottle().refresh, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rota el refresh token y entrega un nuevo access token' })
  async refrescarSesion(
    @Req() peticion: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<LoginResponse> {
    const token = (peticion.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    if (!token) {
      throw new NoAutorizadoError('No hay sesión activa');
    }
    const { usuario, tokens } = await this.refrescar.ejecutar(token);
    this.escribirCookie(peticion, respuesta, tokens.refreshToken, tokens.familia.expiraEn);
    return { accessToken: tokens.accessToken, usuario: this.aSesion(usuario) };
  }

  @Public()
  @Throttle({ default: { limit: limitesThrottle().refresh, ttl: 60_000 } })
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cierra la sesión y revoca el refresh token' })
  async cerrarSesion(
    @Req() peticion: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const token = (peticion.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    await this.cerrar.ejecutar(token);
    this.limpiarCookie(peticion, respuesta);
  }

  @Roles(...ROLES)
  @Get('me')
  @ApiOperation({ summary: 'Devuelve el usuario autenticado' })
  async obtenerSesion(@UsuarioActual() usuario: UsuarioAutenticado): Promise<UsuarioSesion> {
    return this.sesion.ejecutar(usuario.id);
  }

  @Roles(...ROLES)
  @Throttle({ default: { limit: limitesThrottle().login, ttl: 60_000 } })
  @Post('cambiar-contrasena')
  @Auditar('MODIFICAR', 'Usuario')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cambia la contraseña y cierra las demás sesiones del usuario' })
  async cambiarContrasena(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(cambiarContrasenaSchema)) input: CambiarContrasenaInput,
  ): Promise<void> {
    await this.cambiar.ejecutar(usuario.id, usuario.sid, input.actual, input.nueva);
  }

  private aSesion(usuario: UsuarioCredenciales): UsuarioSesion {
    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
      clienteId: usuario.clienteId,
    };
  }

  /**
   * `secure` se deriva del protocolo real de la petición (`trust proxy`), no de
   * NODE_ENV: en local por HTTP sigue funcionando.
   */
  private escribirCookie(
    peticion: Request,
    respuesta: Response,
    token: string,
    expiraEn: number,
  ): void {
    respuesta.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: peticion.secure,
      sameSite: 'strict',
      path: RUTA_COOKIE,
      maxAge: Math.max(0, expiraEn * 1_000 - Date.now()),
    });
  }

  private limpiarCookie(peticion: Request, respuesta: Response): void {
    respuesta.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: peticion.secure,
      sameSite: 'strict',
      path: RUTA_COOKIE,
    });
  }
}
