import { Injectable } from '@nestjs/common';

import { esConflictoUnico } from '../../../../infrastructure/prisma/errores-prisma';
import { ConflictoError } from '../../../../shared-kernel/domain-error';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Cliente } from '../../domain/cliente';
import type {
  ClientesRepositoryPort,
  DatosActualizarCliente,
  DatosCrearCliente,
  FiltrosClientes,
  PaginaClientes,
} from '../../application/ports/clientes.repository.port';

interface FilaCliente {
  id: string;
  tipoIdentificacion: 'CEDULA' | 'RUC' | 'PASAPORTE';
  identificacion: string;
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
  email: string;
  telefono: string | null;
  activo: boolean;
  _count?: { polizas: number };
  createdAt: Date;
  updatedAt: Date;
}

/** D7: `tienePolizas` sale del `_count` de la misma consulta, sin N+1. */
const INCLUIR_POLIZAS = { _count: { select: { polizas: true } } } as const;

@Injectable()
export class PrismaClientesRepository implements ClientesRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: DatosCrearCliente): Promise<Cliente> {
    try {
      const fila = await this.prisma.cliente.create({
        data: {
          tipoIdentificacion: datos.tipoIdentificacion,
          identificacion: datos.identificacion,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          razonSocial: datos.razonSocial,
          email: datos.email,
          telefono: datos.telefono,
        },
      });
      return this.mapear(fila);
    } catch (error: unknown) {
      if (esConflictoUnico(error)) {
        throw this.conflictoIdentificacion();
      }
      throw error;
    }
  }

  async listar(filtros: FiltrosClientes): Promise<PaginaClientes> {
    const palabras = filtros.q?.split(/\s+/).filter(Boolean) ?? [];
    const where = {
      tipoIdentificacion: filtros.tipoIdentificacion,
      activo: filtros.activo,
      // ponytail: ILIKE no ignora tildes (techo); salida: extensión `unaccent`.
      ...(palabras.length > 0
        ? {
            AND: palabras.map((palabra) => ({
              OR: [
                { identificacion: { contains: palabra, mode: 'insensitive' as const } },
                { nombres: { contains: palabra, mode: 'insensitive' as const } },
                { apellidos: { contains: palabra, mode: 'insensitive' as const } },
                { razonSocial: { contains: palabra, mode: 'insensitive' as const } },
                { email: { contains: palabra, mode: 'insensitive' as const } },
              ],
            })),
          }
        : {}),
    };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        include: INCLUIR_POLIZAS,
        orderBy: { createdAt: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return { items: filas.map((fila) => this.mapear(fila)), total };
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const fila = await this.prisma.cliente.findUnique({ where: { id }, include: INCLUIR_POLIZAS });
    return fila ? this.mapear(fila) : null;
  }

  async actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente> {
    try {
      const fila = await this.prisma.cliente.update({
        where: { id },
        data: datos,
        include: INCLUIR_POLIZAS,
      });
      return this.mapear(fila);
    } catch (error: unknown) {
      if (esConflictoUnico(error)) {
        throw this.conflictoIdentificacion();
      }
      throw error;
    }
  }

  async existeIdentificacion(identificacion: string, exceptoId?: string): Promise<boolean> {
    const fila = await this.prisma.cliente.findUnique({ where: { identificacion } });
    return fila !== null && fila.id !== exceptoId;
  }

  private conflictoIdentificacion(): ConflictoError {
    return new ConflictoError('Ya existe un cliente con esa identificación', {
      campo: 'identificacion',
      motivo: 'IDENTIFICACION_DUPLICADA',
    });
  }

  private mapear(fila: FilaCliente): Cliente {
    return Cliente.reconstituir({
      id: fila.id,
      tipoIdentificacion: fila.tipoIdentificacion,
      identificacion: fila.identificacion,
      nombres: fila.nombres,
      apellidos: fila.apellidos,
      razonSocial: fila.razonSocial,
      email: fila.email,
      telefono: fila.telefono,
      activo: fila.activo,
      tienePolizas: (fila._count?.polizas ?? 0) > 0,
      createdAt: fila.createdAt.toISOString(),
      updatedAt: fila.updatedAt.toISOString(),
    });
  }
}
