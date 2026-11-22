import type { EstadoCuota, EstadoPoliza, MetodoPago } from '@oasis/shared';
import { aCentavos, aMonto, aplicarPagoACuotas, fechaEnGuayaquil } from '@oasis/shared';
import { Injectable } from '@nestjs/common';

import { ConflictoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { montoSuperaSaldo } from '../../domain/errores';
import { Pago, type ReciboDelPago } from '../../domain/pago';
import { mapearRecibo } from '../../../recibos/infrastructure/persistence/recibo.mapper';
import { Recibo } from '../../../recibos/domain/recibo';
import type {
  DatosCrearPago,
  DetallePago,
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
  rechazadoPorId: string | null;
  rechazadoEn: Date | null;
  motivoRechazo: string | null;
  nota: string | null;
  createdAt: Date;
  updatedAt: Date;
  poliza?: { numero: string };
  recibo?: { id: string; codigo: string; estado: ReciboDelPago['estado'] } | null;
}

interface FilaCuotaBloqueada {
  id: string;
  numero: number;
  valor: Prisma.Decimal;
  valorPagado: Prisma.Decimal;
  fechaVencimiento: Date;
  estado: EstadoCuota;
}

const ORDEN_RECIENTES = [{ fechaPago: 'desc' as const }, { createdAt: 'desc' as const }];
// D15: PostgreSQL ordena el enum por su declaración (REGISTRADO, VALIDADO, RECHAZADO).
const ORDEN_POR_VALIDAR = [{ estado: 'asc' as const }, ...ORDEN_RECIENTES];

const INCLUIR_PAGO = {
  poliza: true,
  metodoPago: true,
  recibo: { select: { id: true, codigo: true, estado: true } },
} as const;

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
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictoError('La referencia ya está registrada en esta póliza', {
          campo: 'referencia',
          motivo: 'REFERENCIA_DUPLICADA',
        });
      }
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
        include: INCLUIR_PAGO,
        orderBy: filtros.porValidarPrimero ? ORDEN_POR_VALIDAR : ORDEN_RECIENTES,
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      this.prisma.pago.count({ where }),
    ]);

    return { items: filas.map((fila) => this.mapearPago(fila)), total };
  }

  async buscarPorId(id: string): Promise<Pago | null> {
    const fila = await this.prisma.pago.findUnique({ where: { id }, include: INCLUIR_PAGO });
    return fila ? this.mapearPago(fila) : null;
  }

  async buscarDetalle(id: string): Promise<DetallePago | null> {
    const fila = await this.prisma.pago.findUnique({
      where: { id },
      include: {
        ...INCLUIR_PAGO,
        aplicaciones: {
          select: { monto: true, cuota: { select: { numero: true } } },
          orderBy: { cuota: { numero: 'asc' } },
        },
      },
    });
    if (!fila) return null;
    return {
      pago: this.mapearPago(fila),
      aplicaciones: fila.aplicaciones.map((aplicacion) => ({
        cuotaNumero: aplicacion.cuota.numero,
        monto: aplicacion.monto.toFixed(2),
      })),
    };
  }

  async buscarMetodoPago(codigo: MetodoPago): Promise<MetodoPagoResumen | null> {
    const fila = await this.prisma.metodoPago.findFirst({
      where: { activo: true, codigo },
      select: { id: true, codigo: true },
    });
    return fila ? { id: fila.id, codigo: fila.codigo as MetodoPago } : null;
  }

  async estadoPoliza(polizaId: string): Promise<EstadoPoliza | null> {
    const fila = await this.prisma.poliza.findUnique({
      where: { id: polizaId },
      select: { estado: true },
    });
    return fila?.estado ?? null;
  }

  async saldoPoliza(polizaId: string): Promise<string | null> {
    const [poliza, validados] = await Promise.all([
      this.prisma.poliza.findUnique({ where: { id: polizaId }, select: { primaTotal: true } }),
      this.prisma.pago.aggregate({
        where: { polizaId, estado: 'VALIDADO' },
        _sum: { monto: true },
      }),
    ]);
    if (!poliza) return null;
    return poliza.primaTotal.minus(validados._sum.monto ?? 0).toFixed(2);
  }

  async validarYCrearRecibo(datos: DatosValidarPago): Promise<ResultadoValidacion> {
    return this.prisma.$transaction(async (tx) => {
      // Primero el cambio de estado: un pago ya validado o rechazado se informa como tal.
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
      await this.aplicarACuotas(
        tx,
        datos.pagoId,
        filaPago.polizaId,
        filaPago.monto.toFixed(2),
        fechaEnGuayaquil(datos.validadoEn),
      );

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

  /**
   * D12: `FOR UPDATE` serializa las validaciones de la misma póliza; la segunda relee las cuotas
   * ya aplicadas por la primera y RN-02 se decide con ese saldo.
   */
  private async aplicarACuotas(
    tx: Prisma.TransactionClient,
    pagoId: string,
    polizaId: string,
    monto: string,
    hoy: string,
  ): Promise<void> {
    const filas = await tx.$queryRaw<FilaCuotaBloqueada[]>`
      SELECT "id", "numero", "valor", "valorPagado", "fechaVencimiento", "estado"
      FROM "Cuota" WHERE "polizaId" = ${polizaId}::uuid FOR UPDATE`;
    const cuotas = filas.map((fila) => ({
      id: fila.id,
      numero: fila.numero,
      valor: fila.valor.toFixed(2),
      valorPagado: fila.valorPagado.toFixed(2),
      fechaVencimiento: fila.fechaVencimiento.toISOString().slice(0, 10),
      estado: fila.estado,
    }));
    const pendiente = cuotas.reduce(
      (total, cuota) => total + aCentavos(cuota.valor) - aCentavos(cuota.valorPagado),
      0,
    );
    if (aCentavos(monto) > pendiente) {
      throw montoSuperaSaldo(aMonto(pendiente));
    }

    const resultado = aplicarPagoACuotas(cuotas, monto, hoy);
    await tx.aplicacionPago.createMany({
      data: resultado.aplicaciones.map((aplicacion) => ({ pagoId, ...aplicacion })),
    });
    for (const cuota of resultado.cuotas) {
      await tx.cuota.update({
        where: { id: cuota.id },
        data: { valorPagado: cuota.valorPagado, estado: cuota.estado },
      });
    }
  }

  async rechazar(id: string, rechazadoPorId: string, cuando: Date, motivo: string): Promise<Pago> {
    const resultado = await this.prisma.pago.updateMany({
      where: { id, estado: 'REGISTRADO' },
      data: {
        estado: 'RECHAZADO',
        rechazadoPorId,
        rechazadoEn: cuando,
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
      rechazadoPorId: fila.rechazadoPorId,
      rechazadoEn: fila.rechazadoEn === null ? null : fila.rechazadoEn.toISOString(),
      motivoRechazo: fila.motivoRechazo,
      nota: fila.nota,
      createdAt: fila.createdAt.toISOString(),
      updatedAt: fila.updatedAt.toISOString(),
      recibo: fila.recibo,
    });
  }
}
