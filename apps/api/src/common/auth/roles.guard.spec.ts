import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '@oasis/shared';

import { IS_PUBLIC_KEY, ROLES_KEY, type UsuarioAutenticado } from './decorators';
import { RolesGuard } from './roles.guard';

const USUARIO: UsuarioAutenticado = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@oasis.com',
  rol: 'ADMIN',
  clienteId: null,
  sid: 'sid-1',
};

function crearContexto(
  metadatos: { publico?: boolean; rolesHandler?: Rol[]; rolesClase?: Rol[] },
  usuario?: UsuarioAutenticado,
): ExecutionContext {
  const handler = () => undefined;
  const Controlador = class {};
  if (metadatos.publico !== undefined) {
    Reflect.defineMetadata(IS_PUBLIC_KEY, metadatos.publico, handler);
  }
  if (metadatos.rolesHandler) {
    Reflect.defineMetadata(ROLES_KEY, metadatos.rolesHandler, handler);
  }
  if (metadatos.rolesClase) {
    Reflect.defineMetadata(ROLES_KEY, metadatos.rolesClase, Controlador);
  }
  return {
    getHandler: () => handler,
    getClass: () => Controlador,
    switchToHttp: () => ({ getRequest: () => ({ user: usuario }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('deja pasar una ruta pública', () => {
    expect(guard.canActivate(crearContexto({ publico: true }))).toBe(true);
  });

  it('niega con 403 una ruta sin @Roles', () => {
    expect(() => guard.canActivate(crearContexto({}, USUARIO))).toThrow(
      expect.objectContaining({ codigo: 'PROHIBIDO' }),
    );
  });

  it('niega con 403 un rol no incluido', () => {
    const operador = { ...USUARIO, rol: 'OPERADOR' as const };
    expect(() => guard.canActivate(crearContexto({ rolesHandler: ['ADMIN'] }, operador))).toThrow(
      expect.objectContaining({ codigo: 'PROHIBIDO' }),
    );
  });

  it('deja pasar un rol incluido', () => {
    expect(guard.canActivate(crearContexto({ rolesHandler: ['ADMIN'] }, USUARIO))).toBe(true);
  });

  it('@Roles del handler prevalece sobre el de la clase', () => {
    const operador = { ...USUARIO, rol: 'OPERADOR' as const };

    expect(
      guard.canActivate(
        crearContexto({ rolesClase: ['CLIENTE'], rolesHandler: ['ADMIN'] }, USUARIO),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        crearContexto({ rolesClase: ['ADMIN'], rolesHandler: ['OPERADOR'] }, operador),
      ),
    ).toBe(true);
  });
});
