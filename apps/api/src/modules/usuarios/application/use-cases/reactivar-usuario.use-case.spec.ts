import { Usuario } from '../../domain/usuario';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';
import { ReactivarUsuarioUseCase } from './reactivar-usuario.use-case';

const USUARIO_ID = '22222222-2222-2222-2222-222222222222';

function crearUsuario(parcial: Partial<Parameters<typeof Usuario.reconstituir>[0]> = {}) {
  return Usuario.reconstituir({
    id: USUARIO_ID,
    email: 'operador@oasis.com',
    nombre: 'Operador Oasis',
    rol: 'OPERADOR',
    activo: false,
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
    cambiarActivo: jest.fn().mockResolvedValue(usuario),
    cambiarHash: jest.fn(),
    actualizarSiNoEsUltimoAdmin: jest.fn(),
  };
  return { usuarios };
}

describe('ReactivarUsuarioUseCase', () => {
  it('reactiva la cuenta y devuelve el usuario actualizado', async () => {
    const deps = crearDobles();
    const caso = new ReactivarUsuarioUseCase(deps.usuarios);

    const resultado = await caso.ejecutar(USUARIO_ID);

    expect(deps.usuarios.cambiarActivo).toHaveBeenCalledWith(USUARIO_ID, true);
    expect(resultado.id).toBe(USUARIO_ID);
  });

  it('reactivar una cuenta activa es idempotente', async () => {
    const deps = crearDobles(crearUsuario({ activo: true }));
    const caso = new ReactivarUsuarioUseCase(deps.usuarios);

    await expect(caso.ejecutar(USUARIO_ID)).resolves.toMatchObject({ id: USUARIO_ID });
    expect(deps.usuarios.cambiarActivo).toHaveBeenCalledWith(USUARIO_ID, true);
  });
});
