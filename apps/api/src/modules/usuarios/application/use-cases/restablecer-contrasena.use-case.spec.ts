import type { HasherPort } from '../../../auth/application/ports/hasher.port';
import type { AlmacenSesionesPort } from '../../../auth/application/ports/almacen-sesiones.port';
import { Usuario } from '../../domain/usuario';
import type { GeneradorContrasenaPort } from '../ports/generador-contrasena.port';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';
import { RestablecerContrasenaUseCase } from './restablecer-contrasena.use-case';

const ACTOR_ID = '11111111-1111-1111-1111-111111111111';
const USUARIO_ID = '22222222-2222-2222-2222-222222222222';

function crearUsuario(parcial: Partial<Parameters<typeof Usuario.reconstituir>[0]> = {}) {
  return Usuario.reconstituir({
    id: USUARIO_ID,
    email: 'operador@oasis.com',
    nombre: 'Operador Oasis',
    rol: 'OPERADOR',
    activo: true,
    clienteId: null,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...parcial,
  });
}

function crearDobles(usuario: Usuario | null = crearUsuario()) {
  const usuarios: UsuariosRepositoryPort = {
    listar: jest.fn(),
    crear: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(usuario),
    existeCorreo: jest.fn(),
    actualizar: jest.fn(),
    cambiarActivo: jest.fn(),
    cambiarHash: jest.fn().mockResolvedValue(usuario),
    actualizarSiNoEsUltimoAdmin: jest.fn(),
  };
  const generador: GeneradorContrasenaPort = { generar: jest.fn().mockReturnValue('Temporal.456') };
  const hasher: HasherPort = {
    hashear: jest.fn().mockResolvedValue('hash-temporal'),
    verificar: jest.fn(),
  };
  const sesiones: AlmacenSesionesPort = {
    abrir: jest.fn(),
    rotar: jest.fn(),
    tocar: jest.fn(),
    cerrar: jest.fn(),
    cerrarDemas: jest.fn(),
    cerrarTodas: jest.fn(),
  };
  return { usuarios, generador, hasher, sesiones };
}

describe('RestablecerContrasenaUseCase', () => {
  it('restablece la contraseña, cierra las sesiones y devuelve la nueva temporal', async () => {
    const deps = crearDobles();
    const caso = new RestablecerContrasenaUseCase(
      deps.usuarios,
      deps.generador,
      deps.hasher,
      deps.sesiones,
    );

    const resultado = await caso.ejecutar(ACTOR_ID, USUARIO_ID);

    expect(resultado).toEqual({ contrasenaTemporal: 'Temporal.456' });
    expect(deps.hasher.hashear).toHaveBeenCalledWith('Temporal.456');
    expect(deps.usuarios.cambiarHash).toHaveBeenCalledWith(USUARIO_ID, 'hash-temporal');
    expect(deps.sesiones.cerrarTodas).toHaveBeenCalledWith(USUARIO_ID);
  });

  it('no permite restablecer la contraseña a sí mismo', async () => {
    const deps = crearDobles();
    const caso = new RestablecerContrasenaUseCase(
      deps.usuarios,
      deps.generador,
      deps.hasher,
      deps.sesiones,
    );

    await expect(caso.ejecutar(USUARIO_ID, USUARIO_ID)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { motivo: 'AUTO_MODIFICACION' },
    });
    expect(deps.generador.generar).not.toHaveBeenCalled();
  });
});
