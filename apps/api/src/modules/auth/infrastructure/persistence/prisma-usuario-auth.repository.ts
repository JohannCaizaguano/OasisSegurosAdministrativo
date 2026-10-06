import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { UsuarioCredenciales } from '../../domain/usuario-credenciales';
import type { UsuarioAuthRepositoryPort } from '../../application/ports/usuario-auth.repository.port';

interface FilaUsuario {
  id: string;
  email: string;
  passwordHash: string;
  nombre: string;
  rol: 'ADMIN' | 'OPERADOR' | 'CLIENTE';
  activo: boolean;
  clienteId: string | null;
}

@Injectable()
export class PrismaUsuarioAuthRepository implements UsuarioAuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string): Promise<UsuarioCredenciales | null> {
    const fila = await this.prisma.usuario.findUnique({ where: { email } });
    return fila ? this.mapear(fila) : null;
  }

  async buscarPorId(id: string): Promise<UsuarioCredenciales | null> {
    const fila = await this.prisma.usuario.findUnique({ where: { id } });
    return fila ? this.mapear(fila) : null;
  }

  async actualizarPasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.usuario.update({ where: { id }, data: { passwordHash } });
  }

  private mapear(fila: FilaUsuario): UsuarioCredenciales {
    return UsuarioCredenciales.reconstituir({
      id: fila.id,
      email: fila.email,
      passwordHash: fila.passwordHash,
      rol: fila.rol,
      activo: fila.activo,
      clienteId: fila.clienteId,
      nombre: fila.nombre,
    });
  }
}
