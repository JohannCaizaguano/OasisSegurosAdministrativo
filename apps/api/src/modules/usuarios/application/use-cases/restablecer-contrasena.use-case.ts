import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { HasherPort } from '../../../auth/application/ports/hasher.port';
import type { AlmacenSesionesPort } from '../../../auth/application/ports/almacen-sesiones.port';
import type { GeneradorContrasenaPort } from '../ports/generador-contrasena.port';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';

export class RestablecerContrasenaUseCase {
  constructor(
    private readonly usuarios: UsuariosRepositoryPort,
    private readonly generador: GeneradorContrasenaPort,
    private readonly hasher: HasherPort,
    private readonly sesiones: AlmacenSesionesPort,
  ) {}

  async ejecutar(actorId: string, id: string): Promise<{ contrasenaTemporal: string }> {
    const existente = await this.usuarios.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Usuario', id);
    }
    if (id === actorId) {
      throw new ReglaNegocioError(
        'Use el cambio de contraseña de su cuenta para restablecer la suya',
        { motivo: 'AUTO_MODIFICACION' },
      );
    }
    const contrasenaTemporal = this.generador.generar();
    const passwordHash = await this.hasher.hashear(contrasenaTemporal);
    await this.usuarios.cambiarHash(id, passwordHash);
    await this.sesiones.cerrarTodas(id);
    return { contrasenaTemporal };
  }
}
