import { Injectable } from '@nestjs/common';
import { ROLES_PERSONAL, type Rol } from '@oasis/shared';

import { esConflictoUnico } from '../../../../infrastructure/prisma/errores-prisma';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ConflictoError } from '../../../../shared-kernel/domain-error';
import { Usuario } from '../../domain/usuario';
import type {
  DatosActualizarUsuario,
  DatosCrearUsuario,
  FiltrosUsuarios,
  PaginaUsuarios,
  UsuariosRepositoryPort,
} from '../../application/ports/usuarios.repository.port';

interface FilaUsuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  clienteId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaUsuariosRepository implements UsuariosRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: FiltrosUsuarios): Promise<PaginaUsuarios> {
    // Solo personal: las cuentas CLIENTE no se gestionan aquí (D6).
    const where = { rol: { in: [...ROLES_PERSONAL] } };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { items: filas.map((fila) => this.mapear(fila)), total };
  }

  async crear(datos: DatosCrearUsuario): Promise<Usuario> {
    try {
      const fila = await this.prisma.usuario.create({ data: datos });
      return this.mapear(fila);
    } catch (error: unknown) {
      if (esConflictoUnico(error)) {
        throw new ConflictoError('Ya existe un usuario con ese correo', {
          campo: 'email',
          motivo: 'CORREO_DUPLICADO',
        });
      }
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const fila = await this.prisma.usuario.findFirst({
      where: { id, rol: { in: [...ROLES_PERSONAL] } },
    });
    return fila ? this.mapear(fila) : null;
  }

  async existeCorreo(email: string): Promise<boolean> {
    return (await this.prisma.usuario.count({ where: { email } })) > 0;
  }

  async actualizar(id: string, datos: DatosActualizarUsuario): Promise<Usuario> {
    const fila = await this.prisma.usuario.update({ where: { id }, data: datos });
    return this.mapear(fila);
  }

  async cambiarActivo(id: string, activo: boolean): Promise<Usuario> {
    const fila = await this.prisma.usuario.update({ where: { id }, data: { activo } });
    return this.mapear(fila);
  }

  async cambiarHash(id: string, passwordHash: string): Promise<Usuario> {
    const fila = await this.prisma.usuario.update({ where: { id }, data: { passwordHash } });
    return this.mapear(fila);
  }

  async actualizarSiNoEsUltimoAdmin(
    id: string,
    datos: DatosActualizarUsuario & { activo?: boolean },
  ): Promise<'ok' | 'ultimo-admin'> {
    // ponytail: dos ADMIN que se desactivan a la vez pueden ganar la carrera; techo aceptable con
    // pocos administradores. Salida: SELECT … FOR UPDATE sobre los ADMIN activos.
    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUniqueOrThrow({ where: { id } });
      const saleDeAdminActivo =
        usuario.rol === 'ADMIN' &&
        usuario.activo &&
        (datos.rol === 'OPERADOR' || datos.activo === false);
      if (saleDeAdminActivo) {
        const activos = await tx.usuario.count({ where: { rol: 'ADMIN', activo: true } });
        if (activos <= 1) {
          return 'ultimo-admin';
        }
      }
      await tx.usuario.update({ where: { id }, data: datos });
      return 'ok';
    });
  }

  private mapear(fila: FilaUsuario): Usuario {
    return Usuario.reconstituir({
      id: fila.id,
      email: fila.email,
      nombre: fila.nombre,
      rol: fila.rol,
      activo: fila.activo,
      clienteId: fila.clienteId,
      createdAt: fila.createdAt.toISOString(),
      updatedAt: fila.updatedAt.toISOString(),
    });
  }
}
