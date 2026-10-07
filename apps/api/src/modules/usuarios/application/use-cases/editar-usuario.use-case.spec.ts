import type { AlmacenSesionesPort } from '../../../auth/application/ports/almacen-sesiones.port';
import { Usuario } from '../../domain/usuario';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';
import { EditarUsuarioUseCase } from './editar-usuario.use-case';

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
    actualizar: jest.fn().mockResolvedValue(usuario),
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

describe('EditarUsuarioUseCase', () => {
  it('cambiar el rol cierra todas las sesiones', async () => {
    const deps = crearDobles();
    const caso = new EditarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await caso.ejecutar(ACTOR_ID, USUARIO_ID, { rol: 'ADMIN' });

    expect(deps.usuarios.actualizarSiNoEsUltimoAdmin).toHaveBeenCalledWith(USUARIO_ID, {
      rol: 'ADMIN',
    });
    expect(deps.sesiones.cerrarTodas).toHaveBeenCalledWith(USUARIO_ID);
  });

  it('editar solo el nombre no cierra sesiones', async () => {
    const deps = crearDobles();
    const caso = new EditarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await caso.ejecutar(ACTOR_ID, USUARIO_ID, { nombre: 'Nombre Nuevo' });

    expect(deps.usuarios.actualizar).toHaveBeenCalledWith(USUARIO_ID, { nombre: 'Nombre Nuevo' });
    expect(deps.sesiones.cerrarTodas).not.toHaveBeenCalled();
  });

  it('enviar el mismo rol no cierra sesiones', async () => {
    const deps = crearDobles(crearUsuario({ rol: 'ADMIN' }));
    const caso = new EditarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await caso.ejecutar(ACTOR_ID, USUARIO_ID, { nombre: 'Nombre Nuevo', rol: 'ADMIN' });

    expect(deps.usuarios.actualizar).toHaveBeenCalledWith(USUARIO_ID, {
      nombre: 'Nombre Nuevo',
      rol: 'ADMIN',
    });
    expect(deps.sesiones.cerrarTodas).not.toHaveBeenCalled();
  });

  it('no permite quitarse el rol de administrador', async () => {
    const deps = crearDobles(crearUsuario({ rol: 'ADMIN' }));
    const caso = new EditarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await expect(caso.ejecutar(USUARIO_ID, USUARIO_ID, { rol: 'OPERADOR' })).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { motivo: 'AUTO_MODIFICACION' },
    });
    expect(deps.usuarios.actualizarSiNoEsUltimoAdmin).not.toHaveBeenCalled();
  });

  it('no permite degradar al último administrador activo', async () => {
    const deps = crearDobles(crearUsuario({ rol: 'ADMIN' }));
    jest.mocked(deps.usuarios.actualizarSiNoEsUltimoAdmin).mockResolvedValue('ultimo-admin');
    const caso = new EditarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await expect(caso.ejecutar(ACTOR_ID, USUARIO_ID, { rol: 'OPERADOR' })).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { motivo: 'ULTIMO_ADMIN' },
    });
    expect(deps.sesiones.cerrarTodas).not.toHaveBeenCalled();
  });

  it('no gestiona cuentas CLIENTE (404)', async () => {
    const deps = crearDobles(null);
    const caso = new EditarUsuarioUseCase(deps.usuarios, deps.sesiones);

    await expect(caso.ejecutar(ACTOR_ID, USUARIO_ID, { nombre: 'Nadie' })).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});
