import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Usuario } from '../../domain/usuario';
import type {
  FiltrosUsuarios,
  PaginaUsuarios,
  UsuariosRepositoryPort,
} from '../../application/ports/usuarios.repository.port';

@Injectable()
export class PrismaUsuariosRepository implements UsuariosRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: FiltrosUsuarios): Promise<PaginaUsuarios> {
    const where = { rol: filtros.rol };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        orderBy: { email: 'asc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      items: filas.map((fila) =>
        Usuario.reconstituir({
          id: fila.id,
          email: fila.email,
          rol: fila.rol,
          activo: fila.activo,
          clienteId: fila.clienteId,
          createdAt: fila.createdAt.toISOString(),
          updatedAt: fila.updatedAt.toISOString(),
        }),
      ),
      total,
    };
  }
}
