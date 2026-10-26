import type { ExecutionContext } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';

import type { UsuarioAutenticado } from '../auth/decorators';
import { LimitePorUsuarioGuard } from './limite-por-usuario.guard';

function usuario(id: string): UsuarioAutenticado {
  return { id, email: `${id}@oasis.com`, rol: 'CLIENTE', clienteId: null, sid: 'sid' };
}

function contexto(user: UsuarioAutenticado) {
  const cabeceras: Record<string, string> = {};
  const respuesta = {
    setHeader: (nombre: string, valor: string) => {
      cabeceras[nombre] = valor;
    },
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => ({ user }), getResponse: () => respuesta }),
  } as unknown as ExecutionContext;
  return { ctx, cabeceras };
}

describe('LimitePorUsuarioGuard (HU-28, D4)', () => {
  let almacen: ThrottlerStorageService;
  let guard: LimitePorUsuarioGuard;

  beforeEach(() => {
    almacen = new ThrottlerStorageService();
    guard = new LimitePorUsuarioGuard(almacen);
  });

  afterEach(() => almacen.onApplicationShutdown());

  it('admite 30 consultas por minuto y responde 429 con Retry-After en la 31.ª', async () => {
    const { ctx, cabeceras } = contexto(usuario('u1'));
    for (let i = 0; i < 30; i++) {
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    }

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      codigo: 'DEMASIADAS_CONSULTAS',
    });
    expect(Number(cabeceras['Retry-After'])).toBeGreaterThan(0);
  });

  it('el límite de un usuario no afecta a otro', async () => {
    const primero = contexto(usuario('u1'));
    for (let i = 0; i < 30; i++) await guard.canActivate(primero.ctx);
    await expect(guard.canActivate(primero.ctx)).rejects.toBeDefined();

    await expect(guard.canActivate(contexto(usuario('u2')).ctx)).resolves.toBe(true);
  });
});
