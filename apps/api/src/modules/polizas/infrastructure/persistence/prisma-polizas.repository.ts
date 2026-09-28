import { Injectable } from '@nestjs/common';

import { ConflictoError } from '../../../../shared-kernel/domain-error';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Poliza } from '../../domain/poliza';
import type {
  DatosActualizarPoliza,
  DatosCrearPoliza,
  FiltrosPolizas,
  PaginaPolizas,
  PolizasRepositoryPort,
} from '../../application/ports/polizas.repository.port';

interface FilaPoliza {
  id: string;
  numero: string;
  clienteId: string;
  aseguradoraId: string;
  ramo: string;
  primaTotal: { toString(): string };
  fechaInicio: Date;
  fechaFin: Date;
  estado: 'VIGENTE' | 'VENCIDA' | 'CANCELADA';
  createdAt: Date;
  updatedAt: Date;
  cliente?: { nombres: string | null; apellidos: string | null; razonSocial: string | null };
  aseguradora?: { nombre: string };
}

@Injectable()
export class PrismaPolizasRepository implements PolizasRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: DatosCrearPoliza): Promise<Poliza> {
    const fila = await this.prisma.poliza.create({
      data: {
        numero: datos.numero,
        clienteId: datos.clienteId,
        aseguradoraId: datos.aseguradoraId,
        ramo: datos.ramo,
        primaTotal: datos.primaTotal,
        fechaInicio: new Date(`${datos.fechaInicio}T00:00:00.000Z`),
        fechaFin: new Date(`${datos.fechaFin}T00:00:00.000Z`),
        estado: datos.estado,
      },
      include: { cliente: true, aseguradora: true },
    });
    return this.mapear(fila);
  }

  async listar(filtros: FiltrosPolizas): Promise<PaginaPolizas> {
    const where = {
      clienteId: filtros.clienteId,
      estado: filtros.estado,
      ...(filtros.q
        ? {
            OR: [
              { numero: { contains: filtros.q, mode: 'insensitive' as const } },
              { ramo: { contains: filtros.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.poliza.findMany({
        where,
        include: { cliente: true, aseguradora: true },
        orderBy: { createdAt: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.poliza.count({ where }),
    ]);

    return { items: filas.map((fila) => this.mapear(fila)), total };
  }

  async buscarPorId(id: string): Promise<Poliza | null> {
    const fila = await this.prisma.poliza.findUnique({
      where: { id },
      include: { cliente: true, aseguradora: true },
    });
    return fila ? this.mapear(fila) : null;
  }

  async actualizar(id: string, datos: DatosActualizarPoliza): Promise<Poliza> {
    const fila = await this.prisma.poliza.update({
      where: { id },
      data: {
        ...datos,
        ...(datos.fechaInicio
          ? { fechaInicio: new Date(`${datos.fechaInicio}T00:00:00.000Z`) }
          : {}),
        ...(datos.fechaFin ? { fechaFin: new Date(`${datos.fechaFin}T00:00:00.000Z`) } : {}),
      },
      include: { cliente: true, aseguradora: true },
    });
    return this.mapear(fila);
  }

  async eliminar(id: string): Promise<void> {
    try {
      await this.prisma.poliza.delete({ where: { id } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2003') {
        throw new ConflictoError('La póliza tiene pagos asociados');
      }
      throw error;
    }
  }

  async existeNumero(numero: string, exceptoId?: string): Promise<boolean> {
    const fila = await this.prisma.poliza.findUnique({ where: { numero } });
    return fila !== null && fila.id !== exceptoId;
  }

  private mapear(fila: FilaPoliza): Poliza {
    return Poliza.reconstituir({
      id: fila.id,
      numero: fila.numero,
      clienteId: fila.clienteId,
      aseguradoraId: fila.aseguradoraId,
      ramo: fila.ramo,
      primaTotal: fila.primaTotal.toString(),
      fechaInicio: fila.fechaInicio.toISOString().slice(0, 10),
      fechaFin: fila.fechaFin.toISOString().slice(0, 10),
      estado: fila.estado,
      clienteNombre: fila.cliente ? this.nombreCliente(fila.cliente) : undefined,
      aseguradoraNombre: fila.aseguradora?.nombre,
      createdAt: fila.createdAt.toISOString(),
      updatedAt: fila.updatedAt.toISOString(),
    });
  }

  private nombreCliente(cliente: {
    nombres: string | null;
    apellidos: string | null;
    razonSocial: string | null;
  }): string {
    if (cliente.razonSocial) {
      return cliente.razonSocial;
    }
    return [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ');
  }
}
