import { ErrorDependenciaExterna } from '../../../../shared-kernel/domain-error';
import type { UsuarioCredenciales } from '../../domain/usuario-credenciales';
import { UsuarioCredenciales as UsuarioCredencialesClase } from '../../domain/usuario-credenciales';
import type { AlmacenSesionesPort } from '../ports/almacen-sesiones.port';
import type { HasherPort } from '../ports/hasher.port';
import type { UsuarioAuthRepositoryPort } from '../ports/usuario-auth.repository.port';
import { CambiarContrasenaUseCase } from './cambiar-contrasena.use-case';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';

function crearUsuario(): UsuarioCredenciales {
  return UsuarioCredencialesClase.reconstituir({
    id: USUARIO_ID,
    email: 'admin@oasis.com',
    passwordHash: 'hash-viejo',
    rol: 'ADMIN',
    activo: true,
    clienteId: null,
    nombre: 'admin@oasis.com',
  });
}

function crearDependencias(usuario: UsuarioCredenciales | null, actualValida = true) {
  const usuarios: UsuarioAuthRepositoryPort = {
    buscarPorEmail: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(usuario),
    actualizarPasswordHash: jest.fn().mockResolvedValue(undefined),
  };
  const hasher: HasherPort = {
    hashear: jest.fn().mockResolvedValue('hash-nuevo'),
    verificar: jest.fn().mockResolvedValue(actualValida),
  };
  const sesiones: AlmacenSesionesPort = {
    abrir: jest.fn(),
    rotar: jest.fn(),
    tocar: jest.fn(),
    cerrar: jest.fn(),
    cerrarDemas: jest.fn(),
    cerrarTodas: jest.fn(),
  };
  return { usuarios, hasher, sesiones };
}

describe('CambiarContrasenaUseCase', () => {
  it('con la contraseña actual incorrecta lanza ValidacionError en el campo actual y no cambia nada', async () => {
    const deps = crearDependencias(crearUsuario(), false);
    const caso = new CambiarContrasenaUseCase(deps.usuarios, deps.hasher, deps.sesiones);

    await expect(caso.ejecutar(USUARIO_ID, 'sid-1', 'mala', 'Nueva.Clave1')).rejects.toMatchObject({
      codigo: 'VALIDACION',
      detalles: [{ path: ['actual'], message: 'La contraseña actual no es correcta' }],
    });
    expect(deps.usuarios.actualizarPasswordHash).not.toHaveBeenCalled();
  });

  it('guarda el nuevo hash y cierra las demás sesiones, no la actual', async () => {
    const deps = crearDependencias(crearUsuario());
    const caso = new CambiarContrasenaUseCase(deps.usuarios, deps.hasher, deps.sesiones);

    await caso.ejecutar(USUARIO_ID, 'sid-1', 'Actual.123', 'Nueva.Clave1');

    expect(deps.usuarios.actualizarPasswordHash).toHaveBeenCalledWith(USUARIO_ID, 'hash-nuevo');
    expect(deps.sesiones.cerrarDemas).toHaveBeenCalledWith(USUARIO_ID, 'sid-1');
  });

  it('si no puede cerrar las demás sesiones no guarda el nuevo hash', async () => {
    const deps = crearDependencias(crearUsuario());
    jest
      .mocked(deps.sesiones.cerrarDemas)
      .mockRejectedValue(new ErrorDependenciaExterna('Redis no responde'));
    const caso = new CambiarContrasenaUseCase(deps.usuarios, deps.hasher, deps.sesiones);

    await expect(
      caso.ejecutar(USUARIO_ID, 'sid-1', 'Actual.123', 'Nueva.Clave1'),
    ).rejects.toMatchObject({ codigo: 'DEPENDENCIA_EXTERNA' });
    expect(deps.usuarios.actualizarPasswordHash).not.toHaveBeenCalled();
  });

  it('con un usuario inexistente lanza NoEncontradoError', async () => {
    const deps = crearDependencias(null);
    const caso = new CambiarContrasenaUseCase(deps.usuarios, deps.hasher, deps.sesiones);

    await expect(caso.ejecutar(USUARIO_ID, 'sid-1', 'x', 'Nueva.Clave1')).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});
