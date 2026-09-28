import { Injectable } from '@nestjs/common';

import { ConflictoError } from '../../../../shared-kernel/domain-error';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Aseguradora } from '../../domain/aseguradora';
import type {
  AseguradorasRepositoryPort,
  DatosActualizarAseguradora,
  DatosCrearAseguradora,
  FiltrosAseguradoras,
  PaginaAseguradoras,
} from '../../application/ports/aseguradoras.repository.port';

@Injectable()
export class PrismaAseguradorasRepository implements AseguradorasRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: DatosCrearAseguradora): Promise<Aseguradora> {
    const fila = await this.prisma.aseguradora.create({ data: datos });
    return this.mapear(fila);
  }

  async listar(filtros: FiltrosAseguradoras): Promise<PaginaAseguradoras> {
    const where = filtros.q
      ? {
          OR: [
            { nombre: { contains: filtros.q, mode: 'insensitive' as const } },
            { ruc: { contains: filtros.q } },
          ],
        }
      : {};

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.aseguradora.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.aseguradora.count({ where }),
    ]);

    return { items: filas.map((fila) => this.mapear(fila)), total };
  }

  async buscarPorId(id: string): Promise<Aseguradora | null> {
    const fila = await this.prisma.aseguradora.findUnique({ where: { id } });
    return fila ? this.mapear(fila) : null;
  }

  async actualizar(id: string, datos: DatosActualizarAseguradora): Promise<Aseguradora> {
    const fila = await this.prisma.aseguradora.update({ where: { id }, data: datos });
    return this.mapear(fila);
  }

  async eliminar(id: string): Promise<void> {
    try {
      await this.prisma.aseguradora.delete({ where: { id } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2003') {
        throw new ConflictoError('La aseguradora tiene pólizas asociadas');
      }
      throw error;
    }
  }

  async existeRuc(ruc: string, exceptoId?: string): Promise<boolean> {
    const fila = await this.prisma.aseguradora.findUnique({ where: { ruc } });
    return fila !== null && fila.id !== exceptoId;
  }

  private mapear(fila: {
    id: string;
    nombre: string;
    ruc: string;
    createdAt: Date;
    updatedAt: Date;
  }): Aseguradora {
    return Aseguradora.reconstituir({
      id: fila.id,
      nombre: fila.nombre,
      ruc: fila.ruc,
      createdAt: fila.createdAt.toISOString(),
      updatedAt: fila.updatedAt.toISOString(),
    });
  }
}
