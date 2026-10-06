import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  BitacoraRepositoryPort,
  FiltrosBitacora,
  PaginaBitacora,
} from '../../application/ports/bitacora.repository.port';
import type { NuevoRegistroAuditoria } from '../../domain/registro-auditoria';

@Injectable()
export class PrismaBitacoraRepository implements BitacoraRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(registro: NuevoRegistroAuditoria): Promise<void> {
    await this.prisma.bitacoraAuditoria.create({
      data: {
        usuarioId: registro.usuarioId,
        accion: registro.accion,
        entidad: registro.entidad,
        entidadId: registro.entidadId,
        ip: registro.ip,
        detalle: { ...registro.detalle },
      },
    });
  }

  async listar(filtros: FiltrosBitacora): Promise<PaginaBitacora> {
    const where = {
      usuarioId: filtros.usuarioId,
      accion: filtros.accion,
      creadoEn:
        filtros.desde || filtros.hastaExclusivo
          ? { gte: filtros.desde, lt: filtros.hastaExclusivo }
          : undefined,
    };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.bitacoraAuditoria.findMany({
        where,
        include: { usuario: { select: { email: true } } },
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.bitacoraAuditoria.count({ where }),
    ]);

    return {
      items: filas.map((fila) => ({
        id: fila.id,
        usuarioId: fila.usuarioId,
        usuarioEmail: fila.usuario.email,
        accion: fila.accion,
        entidad: fila.entidad,
        entidadId: fila.entidadId,
        ip: fila.ip,
        detalle: esObjetoPlano(fila.detalle) ? fila.detalle : null,
        creadoEn: fila.creadoEn.toISOString(),
      })),
      total,
    };
  }
}

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
