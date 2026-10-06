import type { AlmacenSesionesPort } from '../../../auth/application/ports/almacen-sesiones.port';
import { Usuario } from '../../domain/usuario';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';
import { DesactivarUsuarioUseCase } from './desactivar-usuario.use-case';

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
    cambiarHash: jest.fn(),
    actualizarSiNoEsUltimoAdmin: jest.fn().mockResolvedValue('ok'),
  };
  const sesiones: AlmacenSesionesPort = {
    abrir: jest.fn(),
    rotar: jest.fn(),
    tocar: jest.fn(),
    cerrar: jest.fn(),
    cerrarDemas: jest.fn(),
    cerrarTodas: jest.fn(),
  };
  return { usuarios, sesiones };
}

describe('DesactivarUsuarioUseCase', () => {
  it('no permite desactivarse a sí mismo', async () => {
    const deps = crearDobles();
    const caso = new DesactivarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await expect(caso.ejecutar(USUARIO_ID, USUARIO_ID)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { motivo: 'AUTO_MODIFICACION' },
    });
    expect(deps.usuarios.actualizarSiNoEsUltimoAdmin).not.toHaveBeenCalled();
  });

  it('no permite desactivar al último administrador activo', async () => {
    const deps = crearDobles(crearUsuario({ rol: 'ADMIN' }));
    jest.mocked(deps.usuarios.actualizarSiNoEsUltimoAdmin).mockResolvedValue('ultimo-admin');
    const caso = new DesactivarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await expect(caso.ejecutar(ACTOR_ID, USUARIO_ID)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { motivo: 'ULTIMO_ADMIN' },
    });
    expect(deps.sesiones.cerrarTodas).not.toHaveBeenCalled();
  });

  it('desactiva y cierra todas las sesiones del usuario', async () => {
    const deps = crearDobles();
    const caso = new DesactivarUsuarioUseCase(deps.usuarios, deps.sesiones);

    const resultado = await caso.ejecutar(ACTOR_ID, USUARIO_ID);

    expect(deps.usuarios.actualizarSiNoEsUltimoAdmin).toHaveBeenCalledWith(USUARIO_ID, {
      activo: false,
    });
    expect(deps.sesiones.cerrarTodas).toHaveBeenCalledWith(USUARIO_ID);
    expect(resultado.id).toBe(USUARIO_ID);
  });

  it('desactivar un usuario inactivo vuelve a cerrar sus sesiones', async () => {
    const deps = crearDobles(crearUsuario({ activo: false }));
    const caso = new DesactivarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await caso.ejecutar(ACTOR_ID, USUARIO_ID);

    expect(deps.usuarios.actualizarSiNoEsUltimoAdmin).toHaveBeenCalledWith(USUARIO_ID, {
      activo: false,
    });
    expect(deps.sesiones.cerrarTodas).toHaveBeenCalledWith(USUARIO_ID);
  });
});
