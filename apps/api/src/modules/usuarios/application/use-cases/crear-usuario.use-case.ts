import type { CrearUsuarioInput } from '@oasis/shared';

import { ConflictoError } from '../../../../shared-kernel/domain-error';
import type { HasherPort } from '../../../auth/application/ports/hasher.port';
import type { Usuario } from '../../domain/usuario';
import type { GeneradorContrasenaPort } from '../ports/generador-contrasena.port';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';

export interface UsuarioCreado {
  usuario: Usuario;
  contrasenaTemporal: string;
}

export class CrearUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepositoryPort,
    private readonly generador: GeneradorContrasenaPort,
    private readonly hasher: HasherPort,
  ) {}

  async ejecutar(datos: CrearUsuarioInput): Promise<UsuarioCreado> {
    const email = datos.email.trim().toLowerCase();
    if (await this.usuarios.existeCorreo(email)) {
      throw new ConflictoError('Ya existe un usuario con ese correo', {
        campo: 'email',
        motivo: 'CORREO_DUPLICADO',
      });
    }
    const contrasenaTemporal = this.generador.generar();
    const passwordHash = await this.hasher.hashear(contrasenaTemporal);
    const usuario = await this.usuarios.crear({
      email,
      nombre: datos.nombre,
      rol: datos.rol,
      passwordHash,
    });
    return { usuario, contrasenaTemporal };
  }
}
