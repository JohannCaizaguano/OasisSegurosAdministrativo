import { NoEncontradoError } from '../../../../shared-kernel/domain-error';
import type { Usuario } from '../../domain/usuario';
import type { UsuariosRepositoryPort } from '../ports/usuarios.repository.port';

export class ReactivarUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepositoryPort) {}

  async ejecutar(id: string): Promise<Usuario> {
    const existente = await this.usuarios.buscarPorId(id);
    if (!existente) {
      throw new NoEncontradoError('Usuario', id);
    }
    return this.usuarios.cambiarActivo(id, true);
  }
}
