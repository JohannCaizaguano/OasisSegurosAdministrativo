import type { UsuarioSesion } from '@oasis/shared';

import { NoEncontradoError } from '../../../../shared-kernel/domain-error';
import type { UsuarioAuthRepositoryPort } from '../ports/usuario-auth.repository.port';

export class ObtenerSesionUseCase {
  constructor(private readonly usuarios: UsuarioAuthRepositoryPort) {}

  async ejecutar(usuarioId: string): Promise<UsuarioSesion> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) {
      throw new NoEncontradoError('Usuario', usuarioId);
    }
    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
      clienteId: usuario.clienteId,
    };
  }
}
