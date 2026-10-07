import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { AlmacenSesionesPort } from '../../../auth/application/ports/almacen-sesiones.port';
import type { Usuario } from '../../domain/usuario';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';

export class DesactivarUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepositoryPort,
    private readonly sesiones: AlmacenSesionesPort,
  ) {}

  async ejecutar(actorId: string, id: string): Promise<Usuario> {
    const existente = await this.usuarios.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Usuario', id);
    }
    if (id === actorId) {
      throw new ReglaNegocioError('No puede desactivar su propia cuenta', {
        motivo: 'AUTO_MODIFICACION',
      });
    }
    const resultado = await this.usuarios.actualizarSiNoEsUltimoAdmin(id, { activo: false });
    if (resultado === 'ultimo-admin') {
      throw new ReglaNegocioError('No se puede desactivar al último administrador activo', {
        motivo: 'ULTIMO_ADMIN',
      });
    }
    // Idempotente a propósito: reintentar tras un 502 de Redis vuelve a cerrar las sesiones.
    await this.sesiones.cerrarTodas(id);
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
