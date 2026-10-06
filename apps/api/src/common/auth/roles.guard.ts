import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '@oasis/shared';

import { ProhibidoError } from '../../shared-kernel/domain-error';
import { IS_PUBLIC_KEY, ROLES_KEY, type UsuarioAutenticado } from './decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const destino = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, destino)) {
      return true;
    }
    const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, destino);
    const usuario = context.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>().user;
    // Sin @Roles se niega: una ruta nueva nunca queda abierta a cualquier autenticado (HU-03).
    if (!rolesRequeridos?.length || !usuario || !rolesRequeridos.includes(usuario.rol)) {
      throw new ProhibidoError('No tiene permisos para realizar esta acción');
    }
    return true;
  }
}
