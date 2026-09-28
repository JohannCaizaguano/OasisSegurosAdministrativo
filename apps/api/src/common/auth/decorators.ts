import { ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common';

import type { Rol } from '@oasis/shared';

export const IS_PUBLIC_KEY = 'esPublico';
export const ROLES_KEY = 'rolesRequeridos';

/** Marca un endpoint como público (sin JWT). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe el endpoint a los roles indicados. */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

export interface UsuarioAutenticado {
  id: string;
  email: string;
  rol: Rol;
  clienteId?: string | null;
}

/** Inyecta el usuario autenticado (resultado de la estrategia JWT). */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const request = ctx.switchToHttp().getRequest<{ user: UsuarioAutenticado }>();
    return request.user;
  },
);
