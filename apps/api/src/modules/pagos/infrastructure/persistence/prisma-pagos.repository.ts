import type { MetodoPago } from '@oasis/shared';
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
  MetodoPagoResumen,
  PaginaPagos,
  PagosRepositoryPort,
  ResultadoValidacion,
} from '../../application/ports/pagos.repository.port';

interface FilaPago {
  id: string;
  polizaId: string;
  monto: { toString(): string };
  fechaPago: Date;
  metodoPagoId: string;
  metodoPago: { codigo: string };
  referencia: string | null;
  estado: 'REGISTRADO' | 'VALIDADO' | 'RECHAZADO';
  registradoPorId: string | null;
  validadoPorId: string | null;
  validadoEn: Date | null;
  motivoRechazo: string | null;
  nota: string | null;
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
          metodoPagoId: datos.metodoPagoId,
          registradoPorId: datos.registradoPorId,
          referencia: datos.referencia,
        },
        include: { poliza: true, metodoPago: true },
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
        include: { poliza: true, metodoPago: true },
        orderBy: { fechaPago: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.pago.count({ where }),
    ]);

    return { items: filas.map((fila) => this.mapearPago(fila)), total };
  }

  async buscarPorId(id: string): Promise<Pago | null> {
    const fila = await this.prisma.pago.findUnique({
      where: { id },
      include: { poliza: true, metodoPago: true },
    });
    return fila ? this.mapearPago(fila) : null;
  }

  async buscarMetodoPago(codigo: MetodoPago): Promise<MetodoPagoResumen | null> {
    const fila = await this.prisma.metodoPago.findFirst({
      where: { activo: true, codigo },
      select: { id: true, codigo: true },
    });
    return fila ? { id: fila.id, codigo: fila.codigo as MetodoPago } : null;
  }

  async validarYCrearRecibo(datos: DatosValidarPago): Promise<ResultadoValidacion> {
    return this.prisma.$transaction(async (tx) => {
      const actualizados = await tx.pago.updateMany({
        where: { id: datos.pagoId, estado: 'REGISTRADO' },
        data: {
          estado: 'VALIDADO',
          validadoPorId: datos.validadoPorId,
          validadoEn: datos.validadoEn,
          nota: datos.nota ?? null,
        },
      });

      if (actualizados.count === 0) {
        throw new ReglaNegocioError('El pago ya fue validado o rechazado');
      }

      const filaPago = await tx.pago.findUniqueOrThrow({
        where: { id: datos.pagoId },
        include: { poliza: true, metodoPago: true },
      });

      // El agregado se construye con `Recibo.nuevo()` para que los invariantes
      // de creación los garantice el dominio.
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

  async rechazar(id: string, rechazadoPorId: string, cuando: Date, motivo: string): Promise<Pago> {
    const resultado = await this.prisma.pago.updateMany({
      where: { id, estado: 'REGISTRADO' },
      data: {
        estado: 'RECHAZADO',
        validadoPorId: rechazadoPorId,
        validadoEn: cuando,
        motivoRechazo: motivo,
      },
    });
    if (resultado.count === 0) {
      throw new ReglaNegocioError('El pago ya fue validado o rechazado');
    }
    const fila = await this.prisma.pago.findUniqueOrThrow({
      where: { id },
      include: { poliza: true, metodoPago: true },
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
      metodoPagoId: fila.metodoPagoId,
      // Prisma tipa la columna como `string`; el catálogo solo contiene códigos
      // de `METODOS_PAGO`.
      metodo: fila.metodoPago.codigo as MetodoPago,
      referencia: fila.referencia,
      estado: fila.estado,
      registradoPorId: fila.registradoPorId,
      validadoPorId: fila.validadoPorId,
      validadoEn: fila.validadoEn === null ? null : fila.validadoEn.toISOString(),
      motivoRechazo: fila.motivoRechazo,
      nota: fila.nota,
      createdAt: fila.createdAt.toISOString(),
      updatedAt: fila.updatedAt.toISOString(),
    });
  }
}
