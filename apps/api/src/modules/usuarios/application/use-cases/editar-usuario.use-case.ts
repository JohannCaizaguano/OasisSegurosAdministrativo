import type { ActualizarUsuarioInput } from '@oasis/shared';

import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { AlmacenSesionesPort } from '../../../auth/application/ports/almacen-sesiones.port';
import type { Usuario } from '../../domain/usuario';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';

export class EditarUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepositoryPort,
    private readonly sesiones: AlmacenSesionesPort,
  ) {}

  async ejecutar(actorId: string, id: string, datos: ActualizarUsuarioInput): Promise<Usuario> {
    const existente = await this.usuarios.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Usuario', id);
    }
    const cambiaRol = datos.rol !== undefined && datos.rol !== existente.rol;
    if (cambiaRol) {
      if (id === actorId) {
        throw new ReglaNegocioError('No puede cambiar su propio rol', {
          motivo: 'AUTO_MODIFICACION',
        });
      }
      const resultado = await this.usuarios.actualizarSiNoEsUltimoAdmin(id, datos);
      if (resultado === 'ultimo-admin') {
        throw new ReglaNegocioError('No se puede quitar el rol al último administrador activo', {
          motivo: 'ULTIMO_ADMIN',
        });
      }
      // Si Redis falla aquí (502), el rol ya quedó guardado y el refresco emite el nuevo: el viejo
      // vive como mucho lo que dura el access token, así que no hace falta reintentar.
      await this.sesiones.cerrarTodas(id);
    } else {
      await this.usuarios.actualizar(id, datos);
    }
    return this.releer(id);
  }

  private async releer(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) {
      throw new NoEncontradoError('Usuario', id);
    }
    return usuario;
  }
}
