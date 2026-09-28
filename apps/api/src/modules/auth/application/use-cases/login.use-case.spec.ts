import type { UsuarioCredenciales } from '../../domain/usuario-credenciales';
import { UsuarioCredenciales as UsuarioCredencialesClase } from '../../domain/usuario-credenciales';
import type { AlmacenRefreshPort } from '../ports/almacen-refresh.port';
import type { EmisorTokensPort } from '../ports/emisor-tokens.port';
import type { HasherPort } from '../ports/hasher.port';
import type { UsuarioAuthRepositoryPort } from '../ports/usuario-auth.repository.port';
import { LoginUseCase } from './login.use-case';

function crearUsuario(activo = true): UsuarioCredenciales {
  return UsuarioCredencialesClase.reconstituir({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@oasis.com',
    passwordHash: 'hash-argon2',
    rol: 'ADMIN',
    activo,
    clienteId: null,
    nombre: 'admin@oasis.com',
  });
}

function crearDependencias(usuario: UsuarioCredenciales | null, passwordValida = true) {
  const usuarios: UsuarioAuthRepositoryPort = {
    buscarPorEmail: jest.fn().mockResolvedValue(usuario),
    buscarPorId: jest.fn().mockResolvedValue(usuario),
  };
  const hasher: HasherPort = {
    hashear: jest.fn(),
    verificar: jest.fn().mockResolvedValue(passwordValida),
  };
  const emisor: EmisorTokensPort = {
    emitir: jest.fn().mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      refreshJti: 'jti-1',
    }),
    verificarRefresh: jest.fn(),
  };
  const guardados: string[] = [];
  const almacen: AlmacenRefreshPort = {
    guardar: jest.fn((_usuarioId: string, jti: string) => {
      guardados.push(jti);
      return Promise.resolve();
    }),
    consumir: jest.fn(),
    revocar: jest.fn(),
    revocarTodos: jest.fn(),
  };
  return { usuarios, hasher, emisor, almacen, guardados };
}

describe('LoginUseCase', () => {
  it('emite tokens y registra el jti cuando las credenciales son válidas', async () => {
    const deps = crearDependencias(crearUsuario());
    const caso = new LoginUseCase(deps.usuarios, deps.hasher, deps.emisor, deps.almacen);

    const resultado = await caso.ejecutar('admin@OASIS.com ', 'Admin.Oasis1');

    expect(resultado.tokens.accessToken).toBe('access');
    expect(deps.usuarios.buscarPorEmail).toHaveBeenCalledWith('admin@oasis.com');
    expect(deps.guardados).toEqual(['jti-1']);
  });

  it('rechaza credenciales inválidas con el mismo error', async () => {
    const deps = crearDependencias(crearUsuario(), false);
    const caso = new LoginUseCase(deps.usuarios, deps.hasher, deps.emisor, deps.almacen);

    await expect(caso.ejecutar('admin@oasis.com', 'incorrecta')).rejects.toMatchObject({
      codigo: 'NO_AUTORIZADO',
    });
  });

  it('rechaza usuarios inexistentes sin filtrar su existencia', async () => {
    const deps = crearDependencias(null);
    const caso = new LoginUseCase(deps.usuarios, deps.hasher, deps.emisor, deps.almacen);

    await expect(caso.ejecutar('nadie@oasis.com', 'Admin.Oasis1')).rejects.toMatchObject({
      message: 'Credenciales inválidas',
    });
  });

  it('rechaza usuarios inactivos', async () => {
    const deps = crearDependencias(crearUsuario(false));
    const caso = new LoginUseCase(deps.usuarios, deps.hasher, deps.emisor, deps.almacen);

    await expect(caso.ejecutar('admin@oasis.com', 'Admin.Oasis1')).rejects.toMatchObject({
      codigo: 'NO_AUTORIZADO',
    });
  });
});
