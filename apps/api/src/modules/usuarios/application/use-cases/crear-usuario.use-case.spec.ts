import type { HasherPort } from '../../../auth/application/ports/hasher.port';
import { Usuario } from '../../domain/usuario';
import type { GeneradorContrasenaPort } from '../ports/generador-contrasena.port';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';
import { CrearUsuarioUseCase } from './crear-usuario.use-case';

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
    crear: jest.fn().mockResolvedValue(usuario),
    buscarPorId: jest.fn().mockResolvedValue(usuario),
    existeCorreo: jest.fn().mockResolvedValue(false),
    actualizar: jest.fn().mockResolvedValue(usuario),
    cambiarActivo: jest.fn().mockResolvedValue(usuario),
    cambiarHash: jest.fn().mockResolvedValue(usuario),
    actualizarSiNoEsUltimoAdmin: jest.fn().mockResolvedValue('ok'),
  };
  const generador: GeneradorContrasenaPort = { generar: jest.fn().mockReturnValue('Temporal.123') };
  const hasher: HasherPort = {
    hashear: jest.fn().mockResolvedValue('hash-temporal'),
    verificar: jest.fn().mockResolvedValue(true),
  };
  return { usuarios, generador, hasher };
}

describe('CrearUsuarioUseCase', () => {
  it('crea un operador con contraseña temporal hasheada y la devuelve una vez', async () => {
    const deps = crearDobles();
    const caso = new CrearUsuarioUseCase(deps.usuarios, deps.generador, deps.hasher);

    const resultado = await caso.ejecutar({
      email: ' Nuevo@Oasis.com ',
      nombre: 'Nuevo Usuario',
      rol: 'OPERADOR',
    });

    expect(resultado.contrasenaTemporal).toBe('Temporal.123');
    expect(deps.hasher.hashear).toHaveBeenCalledWith('Temporal.123');
    expect(deps.usuarios.crear).toHaveBeenCalledWith({
      email: 'nuevo@oasis.com',
      nombre: 'Nuevo Usuario',
      rol: 'OPERADOR',
      passwordHash: 'hash-temporal',
    });
  });

  it('rechaza un correo ya registrado con 409 en el campo email', async () => {
    const deps = crearDobles();
    jest.mocked(deps.usuarios.existeCorreo).mockResolvedValue(true);
    const caso = new CrearUsuarioUseCase(deps.usuarios, deps.generador, deps.hasher);

    await expect(
      caso.ejecutar({ email: 'admin@oasis.com', nombre: 'Otro Admin', rol: 'ADMIN' }),
    ).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'email', motivo: 'CORREO_DUPLICADO' },
    });
    expect(deps.usuarios.crear).not.toHaveBeenCalled();
    expect(deps.generador.generar).not.toHaveBeenCalled();
  });
});
