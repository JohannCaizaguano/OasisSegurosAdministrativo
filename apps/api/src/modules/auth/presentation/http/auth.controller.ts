import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { LoginInput, LoginResponse, UsuarioSesion } from '@oasis/shared';
import { loginSchema } from '@oasis/shared';

import { NoAutorizadoError } from '../../../../shared-kernel/domain-error';
import { duracionASegundos } from '../../../../shared-kernel/duracion';
import { AppConfig } from '../../../../config/app.config';
import { Public, UsuarioActual, type UsuarioAutenticado } from '../../../../common/auth/decorators';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';
import { CerrarSesionUseCase } from '../../application/use-cases/cerrar-sesion.use-case';
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
    private readonly config: AppConfig,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Inicia sesión y entrega un access token + cookie de refresh' })
  async iniciarSesion(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<LoginResponse> {
    const { usuario, tokens } = await this.login.ejecutar(input.email, input.password);
    this.escribirCookie(respuesta, tokens.refreshToken);
    return { accessToken: tokens.accessToken, usuario: this.aSesion(usuario) };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
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
    this.escribirCookie(respuesta, tokens.refreshToken);
    return { accessToken: tokens.accessToken, usuario: this.aSesion(usuario) };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cierra la sesión y revoca el refresh token' })
  async cerrarSesion(
    @Req() peticion: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const token = (peticion.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    await this.cerrar.ejecutar(token);
    this.limpiarCookie(respuesta);
  }

  @Get('me')
  @ApiOperation({ summary: 'Devuelve el usuario autenticado' })
  async obtenerSesion(@UsuarioActual() usuario: UsuarioAutenticado): Promise<UsuarioSesion> {
    return this.sesion.ejecutar(usuario.id);
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

  private escribirCookie(respuesta: Response, token: string): void {
    respuesta.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.esProduccion,
      sameSite: 'strict',
      path: RUTA_COOKIE,
      maxAge: duracionASegundos(this.config.auth.refreshTtl) * 1_000,
    });
  }

  private limpiarCookie(respuesta: Response): void {
    respuesta.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.config.esProduccion,
      sameSite: 'strict',
      path: RUTA_COOKIE,
    });
  }
}
