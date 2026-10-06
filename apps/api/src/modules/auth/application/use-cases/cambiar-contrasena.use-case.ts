import { NoEncontradoError, ValidacionError } from '../../../../shared-kernel/domain-error';
import type { AlmacenSesionesPort } from '../ports/almacen-sesiones.port';
import type { HasherPort } from '../ports/hasher.port';
import type { UsuarioAuthRepositoryPort } from '../ports/usuario-auth.repository.port';

export class CambiarContrasenaUseCase {
  constructor(
    private readonly usuarios: UsuarioAuthRepositoryPort,
    private readonly hasher: HasherPort,
    private readonly sesiones: AlmacenSesionesPort,
  ) {}

  async ejecutar(
    usuarioId: string,
    sidVigente: string,
    actual: string,
    nueva: string,
  ): Promise<void> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) {
      throw new NoEncontradoError('Usuario', usuarioId);
    }
    if (!(await this.hasher.verificar(usuario.passwordHash, actual))) {
      const mensaje = 'La contraseña actual no es correcta';
      // Mismo formato que los issues de Zod: la SPA lo muestra en el campo.
      throw new ValidacionError(mensaje, [{ path: ['actual'], message: mensaje }]);
    }
    const hashNuevo = await this.hasher.hashear(nueva);
    // Primero las sesiones: si Redis falla, la contraseña no cambia y nada queda a medias.
    await this.sesiones.cerrarDemas(usuarioId, sidVigente);
    await this.usuarios.actualizarPasswordHash(usuarioId, hashNuevo);
  }
}
