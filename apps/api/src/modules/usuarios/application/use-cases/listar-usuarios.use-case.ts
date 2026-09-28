import type { PaginaUsuarios, UsuariosRepositoryPort } from '../ports/usuarios.repository.port';

export class ListarUsuariosUseCase {
  constructor(private readonly usuarios: UsuariosRepositoryPort) {}

  ejecutar(filtros: {
    rol?: Parameters<UsuariosRepositoryPort['listar']>[0]['rol'];
    pagina: number;
    porPagina: number;
  }): Promise<PaginaUsuarios> {
    return this.usuarios.listar(filtros);
  }
}
