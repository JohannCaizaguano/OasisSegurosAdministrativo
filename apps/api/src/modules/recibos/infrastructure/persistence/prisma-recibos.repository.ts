import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { Recibo } from '../../domain/recibo';
import type {
  FiltrosRecibos,
  PaginaRecibos,
  RecibosRepositoryPort,
} from '../../application/ports/recibos.repository.port';
import { mapearRecibo } from './recibo.mapper';

const INCLUDE = { pago: { include: { poliza: true } } } as const;

@Injectable()
export class PrismaRecibosRepository implements RecibosRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Recibo | null> {
    const fila = await this.prisma.recibo.findUnique({ where: { id }, include: INCLUDE });
    return fila ? mapearRecibo(fila) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<Recibo | null> {
    const fila = await this.prisma.recibo.findUnique({ where: { codigo }, include: INCLUDE });
    return fila ? mapearRecibo(fila) : null;
  }

  async listar(filtros: FiltrosRecibos): Promise<PaginaRecibos> {
    const where = { estado: filtros.estado };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.recibo.findMany({
        where,
        include: INCLUDE,
        orderBy: { creadoEn: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.recibo.count({ where }),
    ]);

    return { items: filas.map((fila) => mapearRecibo(fila)), total };
  }

  async guardar(recibo: Recibo): Promise<Recibo> {
    const fila = await this.prisma.recibo.update({
      where: { id: recibo.id },
      data: {
        estado: recibo.estado,
        txHash: recibo.txHash,
        blockNumber: recibo.blockNumber === null ? null : BigInt(recibo.blockNumber),
        gasUsed: recibo.gasUsed === null ? null : BigInt(recibo.gasUsed),
        effectiveGasPrice:
          recibo.effectiveGasPrice === null ? null : BigInt(recibo.effectiveGasPrice),
        intentos: recibo.intentos,
        ultimoError: recibo.ultimoError,
        enviadoEn: recibo.enviadoEn === null ? null : new Date(recibo.enviadoEn),
        ancladoEn: recibo.ancladoEn === null ? null : new Date(recibo.ancladoEn),
      },
      include: INCLUDE,
    });
    return mapearRecibo(fila);
  }

  async listarPendientes(creadosAntesDe: Date): Promise<Recibo[]> {
    const filas = await this.prisma.recibo.findMany({
      where: { estado: 'PENDIENTE_ANCLAJE', creadoEn: { lt: creadosAntesDe } },
      include: INCLUDE,
      orderBy: { creadoEn: 'asc' },
    });
    return filas.map((fila) => mapearRecibo(fila));
  }

  async contarPendientes(): Promise<number> {
    return this.prisma.recibo.count({
      where: { estado: { in: ['PENDIENTE_ANCLAJE', 'ENVIADO'] } },
    });
  }
}
