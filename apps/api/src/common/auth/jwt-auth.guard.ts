import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { NoAutorizadoError } from '../../shared-kernel/domain-error';
import { IS_PUBLIC_KEY, type UsuarioAutenticado } from '../auth/decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) {
      return true;
    }
    return super.canActivate(context);
  }

  override handleRequest<TUser = UsuarioAutenticado>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw err instanceof Error ? err : new NoAutorizadoError('Token inválido o expirado');
    }
    return user;
  }
}
