import { Injectable } from '@nestjs/common';

import { ConflictoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Pago } from '../../domain/pago';
import { mapearRecibo } from '../../../recibos/infrastructure/persistence/recibo.mapper';
import { Recibo } from '../../../recibos/domain/recibo';
import type {
  DatosCrearPago,
  DatosValidarPago,
  FiltrosPagos,
  PaginaPagos,
  PagosRepositoryPort,
  ResultadoValidacion,
} from '../../application/ports/pagos.repository.port';

interface FilaPago {
  id: string;
  polizaId: string;
  monto: { toString(): string };
  fechaPago: Date;
  metodo: 'TRANSFERENCIA' | 'EFECTIVO' | 'TARJETA' | 'CHEQUE';
  referencia: string | null;
  estado: 'REGISTRADO' | 'VALIDADO' | 'RECHAZADO';
  validadoPorId: string | null;
  validadoEn: Date | null;
  createdAt: Date;
  updatedAt: Date;
  poliza?: { numero: string };
}

@Injectable()
export class PrismaPagosRepository implements PagosRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: DatosCrearPago): Promise<Pago> {
    try {
      const fila = await this.prisma.pago.create({
        data: {
          polizaId: datos.polizaId,
          monto: datos.monto,
          fechaPago: new Date(`${datos.fechaPago}T00:00:00.000Z`),
          metodo: datos.metodo,
          referencia: datos.referencia,
        },
        include: { poliza: true },
      });
      return this.mapearPago(fila);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2003') {
        throw new ConflictoError('La póliza indicada no existe');
      }
      throw error;
    }
  }

  async listar(filtros: FiltrosPagos): Promise<PaginaPagos> {
    const where = {
      estado: filtros.estado,
      polizaId: filtros.polizaId,
      ...(filtros.clienteId ? { poliza: { clienteId: filtros.clienteId } } : {}),
      ...(filtros.desde || filtros.hasta
        ? {
            fechaPago: {
              ...(filtros.desde ? { gte: new Date(`${filtros.desde}T00:00:00.000Z`) } : {}),
              ...(filtros.hasta ? { lte: new Date(`${filtros.hasta}T00:00:00.000Z`) } : {}),
            },
          }
        : {}),
      ...(filtros.q ? { referencia: { contains: filtros.q, mode: 'insensitive' as const } } : {}),
    };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.pago.findMany({
        where,
        include: { poliza: true },
        orderBy: { fechaPago: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.pago.count({ where }),
    ]);

    return { items: filas.map((fila) => this.mapearPago(fila)), total };
  }

  async buscarPorId(id: string): Promise<Pago | null> {
    const fila = await this.prisma.pago.findUnique({ where: { id }, include: { poliza: true } });
    return fila ? this.mapearPago(fila) : null;
  }

  async validarYCrearRecibo(datos: DatosValidarPago): Promise<ResultadoValidacion> {
    return this.prisma.$transaction(async (tx) => {
      const actualizados = await tx.pago.updateMany({
        where: { id: datos.pagoId, estado: 'REGISTRADO' },
        data: {
          estado: 'VALIDADO',
          validadoPorId: datos.validadoPorId,
          validadoEn: datos.validadoEn,
        },
      });

      if (actualizados.count === 0) {
        throw new ReglaNegocioError('El pago ya fue validado o rechazado');
      }

      const filaPago = await tx.pago.findUniqueOrThrow({
        where: { id: datos.pagoId },
        include: { poliza: true },
      });

      // Se construye el agregado con `Recibo.nuevo()` en lugar de escribir las
      // columnas a mano: así los invariantes de creación (estado inicial,
      // txHash/gas/block nulos, contadores a cero) quedan garantizados por el
      // dominio y no por una cadena literal repetida en el adaptador.
      const recibo = Recibo.nuevo(datos.recibo);
      const filaRecibo = await tx.recibo.create({
        data: {
          id: recibo.id,
          codigo: recibo.codigo,
          pagoId: recibo.pagoId,
          idOnchain: recibo.idOnchain,
          hashRecibo: recibo.hashRecibo,
          sal: recibo.sal,
          payloadCanonico: recibo.payloadCanonico,
          estado: recibo.estado,
          chainId: recibo.chainId,
          contractAddress: recibo.contractAddress,
          creadoEn: new Date(recibo.creadoEn),
        },
        include: { pago: { include: { poliza: true } } },
      });

      return {
        pago: this.mapearPago(filaPago),
        recibo: mapearRecibo(filaRecibo),
      };
    });
  }

  async rechazar(id: string, rechazadoPorId: string, cuando: Date): Promise<Pago> {
    const resultado = await this.prisma.pago.updateMany({
      where: { id, estado: 'REGISTRADO' },
      data: { estado: 'RECHAZADO', validadoPorId: rechazadoPorId, validadoEn: cuando },
    });
    if (resultado.count === 0) {
      throw new ReglaNegocioError('El pago ya fue validado o rechazado');
    }
    const fila = await this.prisma.pago.findUniqueOrThrow({
      where: { id },
      include: { poliza: true },
    });
    return this.mapearPago(fila);
  }

  private mapearPago(fila: FilaPago): Pago {
    return Pago.reconstituir({
      id: fila.id,
      polizaId: fila.polizaId,
      numeroPoliza: fila.poliza?.numero,
      monto: fila.monto.toString(),
      fechaPago: fila.fechaPago.toISOString().slice(0, 10),
      metodo: fila.metodo,
      referencia: fila.referencia,
      estado: fila.estado,
      validadoPorId: fila.validadoPorId,
      validadoEn: fila.validadoEn === null ? null : fila.validadoEn.toISOString(),
      createdAt: fila.createdAt.toISOString(),
      updatedAt: fila.updatedAt.toISOString(),
    });
  }
}
