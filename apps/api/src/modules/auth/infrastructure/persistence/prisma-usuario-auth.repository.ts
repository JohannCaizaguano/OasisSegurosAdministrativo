import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { UsuarioCredenciales } from '../../domain/usuario-credenciales';
import type { UsuarioAuthRepositoryPort } from '../../application/ports/usuario-auth.repository.port';

interface FilaUsuario {
  id: string;
  email: string;
  passwordHash: string;
  rol: 'ADMIN' | 'OPERADOR' | 'CLIENTE';
  activo: boolean;
  clienteId: string | null;
  cliente: {
    nombres: string | null;
    apellidos: string | null;
    razonSocial: string | null;
  } | null;
}

@Injectable()
export class PrismaUsuarioAuthRepository implements UsuarioAuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string): Promise<UsuarioCredenciales | null> {
    const fila = await this.prisma.usuario.findUnique({
      where: { email },
      include: { cliente: true },
    });
    return fila ? this.mapear(fila) : null;
  }

  async buscarPorId(id: string): Promise<UsuarioCredenciales | null> {
    const fila = await this.prisma.usuario.findUnique({
      where: { id },
      include: { cliente: true },
    });
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
      nombre: this.nombreVisible(fila),
    });
  }

  private nombreVisible(fila: FilaUsuario): string {
    if (!fila.cliente) {
      return fila.email;
    }
    if (fila.cliente.razonSocial) {
      return fila.cliente.razonSocial;
    }
    const nombre = [fila.cliente.nombres, fila.cliente.apellidos].filter(Boolean).join(' ');
    return nombre.length > 0 ? nombre : fila.email;
  }
}
