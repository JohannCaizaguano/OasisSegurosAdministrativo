import type { UsuarioCredenciales } from '../../domain/usuario-credenciales';
import { UsuarioCredenciales as UsuarioCredencialesClase } from '../../domain/usuario-credenciales';
import type { AlmacenSesionesPort, ResultadoRotacion } from '../ports/almacen-sesiones.port';
import type { EmisorTokensPort } from '../ports/emisor-tokens.port';
import type { UsuarioAuthRepositoryPort } from '../ports/usuario-auth.repository.port';
import { RefrescarSesionUseCase } from './refrescar-sesion.use-case';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';

function crearUsuario(activo = true): UsuarioCredenciales {
  return UsuarioCredencialesClase.reconstituir({
    id: USUARIO_ID,
    email: 'admin@oasis.com',
    passwordHash: 'hash-argon2',
    rol: 'ADMIN',
    activo,
    clienteId: null,
    nombre: 'admin@oasis.com',
  });
}

function crearDependencias(
  usuario: UsuarioCredenciales | null,
  rotacion: ResultadoRotacion = 'ROTADA',
) {
  const usuarios: UsuarioAuthRepositoryPort = {
    buscarPorEmail: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(usuario),
    actualizarPasswordHash: jest.fn(),
  };
  const emisor: EmisorTokensPort = {
    emitir: jest.fn().mockImplementation((_payload, familia) =>
      Promise.resolve({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
        refreshJti: 'jti-2',
        familia: familia ?? { sid: 'sid-1', expiraEn: 1_800_000_000 },
      }),
    ),
    verificarRefresh: jest.fn().mockResolvedValue({
      sub: USUARIO_ID,
      sid: 'sid-1',
      jti: 'jti-1',
      expiraEn: 1_800_000_000,
    }),
  };
  const almacen: AlmacenSesionesPort = {
    abrir: jest.fn(),
    rotar: jest.fn().mockResolvedValue(rotacion),
    tocar: jest.fn(),
    cerrar: jest.fn(),
    cerrarDemas: jest.fn(),
    cerrarTodas: jest.fn(),
  };
  return { usuarios, emisor, almacen };
}

describe('RefrescarSesionUseCase', () => {
  it('rota el jti y conserva la familia', async () => {
    const deps = crearDependencias(crearUsuario());
    const caso = new RefrescarSesionUseCase(deps.usuarios, deps.emisor, deps.almacen);

    const resultado = await caso.ejecutar('refresh-vigente');

    expect(deps.emisor.emitir).toHaveBeenCalledWith(expect.anything(), {
      sid: 'sid-1',
      expiraEn: 1_800_000_000,
    });
    expect(deps.almacen.rotar).toHaveBeenCalledWith(USUARIO_ID, 'sid-1', 'jti-1', 'jti-2');
    expect(resultado.tokens.refreshToken).toBe('refresh-2');
  });

  it('con un jti que ya rotó responde 401', async () => {
    const deps = crearDependencias(crearUsuario(), 'REUTILIZADA');
    const caso = new RefrescarSesionUseCase(deps.usuarios, deps.emisor, deps.almacen);

    await expect(caso.ejecutar('refresh-viejo')).rejects.toMatchObject({
      codigo: 'NO_AUTORIZADO',
    });
  });

  it('con la sesión expirada responde 401', async () => {
    const deps = crearDependencias(crearUsuario(), 'EXPIRADA');
    const caso = new RefrescarSesionUseCase(deps.usuarios, deps.emisor, deps.almacen);

    await expect(caso.ejecutar('refresh-vencido')).rejects.toMatchObject({
      codigo: 'NO_AUTORIZADO',
    });
  });

  it('con el usuario inactivo cierra la sesión y responde 401', async () => {
    const deps = crearDependencias(crearUsuario(false));
    const caso = new RefrescarSesionUseCase(deps.usuarios, deps.emisor, deps.almacen);

    await expect(caso.ejecutar('refresh-vigente')).rejects.toMatchObject({
      codigo: 'NO_AUTORIZADO',
    });
    expect(deps.almacen.cerrar).toHaveBeenCalledWith(USUARIO_ID, 'sid-1');
  });

  it('con un token inválido responde 401 sin tocar el almacén', async () => {
    const deps = crearDependencias(crearUsuario());
    (deps.emisor.verificarRefresh as jest.Mock).mockResolvedValue(null);
    const caso = new RefrescarSesionUseCase(deps.usuarios, deps.emisor, deps.almacen);

    await expect(caso.ejecutar('basura')).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO' });
    expect(deps.almacen.rotar).not.toHaveBeenCalled();
    expect(deps.almacen.cerrar).not.toHaveBeenCalled();
  });
});
