import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '@oasis/shared';

import { ProhibidoError } from '../../shared-kernel/domain-error';
import { ROLES_KEY, type UsuarioAutenticado } from './decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>();
    const usuario = request.user;

    if (!usuario || !rolesRequeridos.includes(usuario.rol)) {
      throw new ProhibidoError('No tiene permisos para realizar esta acción');
    }

    return true;
  }
}
