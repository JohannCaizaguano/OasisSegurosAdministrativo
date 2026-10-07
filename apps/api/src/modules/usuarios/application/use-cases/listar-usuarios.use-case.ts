import type { PaginaUsuarios, UsuariosRepositoryPort } from '../ports/usuarios.repository.port';

export class ListarUsuariosUseCase {
  constructor(private readonly usuarios: UsuariosRepositoryPort) {}

  ejecutar(filtros: { pagina: number; porPagina: number }): Promise<PaginaUsuarios> {
    return this.usuarios.listar(filtros);
  }
}
