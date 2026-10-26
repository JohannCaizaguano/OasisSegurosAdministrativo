import type { MetodoPago } from '@oasis/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { Recibo } from '../../domain/recibo';
import type {
  DatosReciboImprimible,
  FiltrosRecibos,
  PaginaRecibos,
  RecibosRepositoryPort,
} from '../../application/ports/recibos.repository.port';
import { mapearRecibo } from './recibo.mapper';

const INCLUDE = { pago: { include: { poliza: true } } } as const;

const SELECT_IMPRIMIBLE = {
  codigo: true,
  estado: true,
  creadoEn: true,
  ancladoEn: true,
  txHash: true,
  pago: {
    select: {
      monto: true,
      fechaPago: true,
      referencia: true,
      metodoPago: { select: { codigo: true } },
      poliza: {
        select: {
          numero: true,
          clienteId: true,
          ramo: { select: { nombre: true } },
          aseguradora: { select: { nombre: true } },
          cliente: {
            select: { identificacion: true, nombres: true, apellidos: true, razonSocial: true },
          },
        },
      },
    },
  },
} as const;

function nombreCliente(cliente: {
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
}): string {
  return cliente.razonSocial ?? [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ');
}

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

  async buscarImprimible(id: string): Promise<DatosReciboImprimible | null> {
    const fila = await this.prisma.recibo.findUnique({ where: { id }, select: SELECT_IMPRIMIBLE });
    if (!fila) return null;
    const { pago } = fila;
    return {
      codigo: fila.codigo,
      estado: fila.estado,
      creadoEn: fila.creadoEn.toISOString(),
      ancladoEn: fila.ancladoEn?.toISOString() ?? null,
      txHash: fila.txHash,
      pago: {
        monto: pago.monto.toFixed(2),
        fechaPago: pago.fechaPago.toISOString().slice(0, 10),
        // El catálogo solo contiene códigos de `METODOS_PAGO`.
        metodo: pago.metodoPago.codigo as MetodoPago,
        referencia: pago.referencia,
      },
      poliza: {
        numero: pago.poliza.numero,
        ramo: pago.poliza.ramo.nombre,
        aseguradora: pago.poliza.aseguradora.nombre,
        clienteId: pago.poliza.clienteId,
      },
      cliente: {
        nombre: nombreCliente(pago.poliza.cliente),
        identificacion: pago.poliza.cliente.identificacion,
      },
    };
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

  /**
   * El barrido cubre también los ENVIADO (caída tras enviar o espera del
   * receipt agotada): `AnclarReciboUseCase` es idempotente y solo sincroniza; la
   * antigüedad se mide desde `enviadoEn`.
   */
  async listarPendientes(antesDe: Date): Promise<Recibo[]> {
    const filas = await this.prisma.recibo.findMany({
      where: {
        OR: [
          { estado: 'PENDIENTE_ANCLAJE', creadoEn: { lt: antesDe } },
          { estado: 'ENVIADO', enviadoEn: { lt: antesDe } },
        ],
      },
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
