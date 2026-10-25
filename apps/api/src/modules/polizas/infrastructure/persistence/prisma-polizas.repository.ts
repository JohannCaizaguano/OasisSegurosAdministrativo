import type { Cuota, EstadoPoliza, OrdenPoliza } from '@oasis/shared';
import { Injectable } from '@nestjs/common';

import { esConflictoUnico } from '../../../../infrastructure/prisma/errores-prisma';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Prisma } from '../../../../generated/prisma/client';
import { ConflictoError } from '../../../../shared-kernel/domain-error';
import { numeroDuplicado, planConPagosValidados } from '../../domain/errores';
import type { CuotaDelPlan } from '../../domain/plan-cuotas';
import { Poliza } from '../../domain/poliza';
import type {
  DatosActualizarPoliza,
  DatosCrearPoliza,
  FiltrosPolizas,
  PaginaPolizas,
  PolizasRepositoryPort,
  RamoResumen,
} from '../../application/ports/polizas.repository.port';

interface FilaPoliza {
  id: string;
  numero: string;
  clienteId: string;
  aseguradoraId: string;
  ramoId: string;
  ramo: { nombre: string };
  primaTotal: { toString(): string };
  fechaInicio: Date;
  fechaFin: Date;
  estado: 'VIGENTE' | 'VENCIDA' | 'CANCELADA';
  createdAt: Date;
  updatedAt: Date;
  _count: { pagos: number; cuotas: number };
  cliente?: { nombres: string | null; apellidos: string | null; razonSocial: string | null };
  aseguradora?: { nombre: string };
}

/** `tienePagosValidados` (D11) y `enMora` (D15) salen de `_count` filtrados, sin N+1. */
const INCLUIR_POLIZA = {
  cliente: true,
  aseguradora: true,
  ramo: true,
  _count: {
    select: {
      pagos: { where: { estado: 'VALIDADO' as const } },
      cuotas: { where: { estado: 'VENCIDA' as const } },
    },
  },
} as const;

const aFecha = (fecha: string) => new Date(`${fecha}T00:00:00.000Z`);

/** D15: `recientes` es el orden por defecto. */
const ORDEN_POLIZAS: Record<OrdenPoliza, Prisma.PolizaOrderByWithRelationInput[]> = {
  recientes: [{ createdAt: 'desc' }],
  fechaFinAsc: [{ fechaFin: 'asc' }, { numero: 'asc' }],
  fechaFinDesc: [{ fechaFin: 'desc' }, { numero: 'desc' }],
};

const CAMPOS_RAMO = { id: true, codigo: true, nombre: true } as const;

@Injectable()
export class PrismaPolizasRepository implements PolizasRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: DatosCrearPoliza): Promise<Poliza> {
    try {
      const fila = await this.prisma.poliza.create({
        data: {
          numero: datos.numero,
          clienteId: datos.clienteId,
          aseguradoraId: datos.aseguradoraId,
          ramoId: datos.ramoId,
          primaTotal: datos.primaTotal,
          fechaInicio: aFecha(datos.fechaInicio),
          fechaFin: aFecha(datos.fechaFin),
          // D11: pago único por defecto, creado en la misma escritura que la póliza.
          cuotas: {
            create: {
              numero: 1,
              valor: datos.primaTotal,
              fechaVencimiento: aFecha(datos.fechaInicio),
            },
          },
        },
        include: INCLUIR_POLIZA,
      });
      return this.mapear(fila);
    } catch (error: unknown) {
      if (esConflictoUnico(error)) {
        throw numeroDuplicado(datos.numero);
      }
      throw error;
    }
  }

  async listar(filtros: FiltrosPolizas): Promise<PaginaPolizas> {
    const where = {
      clienteId: filtros.clienteId,
      aseguradoraId: filtros.aseguradoraId,
      estado: filtros.estado,
      ...(filtros.q ? { numero: { contains: filtros.q, mode: 'insensitive' as const } } : {}),
    };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.poliza.findMany({
        where,
        include: INCLUIR_POLIZA,
        orderBy: ORDEN_POLIZAS[filtros.orden],
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
      include: INCLUIR_POLIZA,
    });
    return fila ? this.mapear(fila) : null;
  }

  /** Escritura condicional: solo si sigue VIGENTE y, al cambiar la prima, sin pagos validados. */
  async actualizar(
    id: string,
    datos: DatosActualizarPoliza,
    cuotas?: CuotaDelPlan[],
  ): Promise<Poliza> {
    try {
      const count = cuotas
        ? await this.prisma.$transaction(async (tx) => {
            const escritas = await this.escribirPoliza(tx, id, datos);
            if (escritas > 0) await this.escribirCuotas(tx, id, cuotas);
            return escritas;
          })
        : await this.escribirPoliza(this.prisma, id, datos);
      return this.releerTrasEscribir(id, count);
    } catch (error: unknown) {
      if (datos.numero !== undefined && esConflictoUnico(error)) {
        throw numeroDuplicado(datos.numero);
      }
      throw error;
    }
  }

  async listarCuotas(polizaId: string): Promise<Cuota[]> {
    const filas = await this.prisma.cuota.findMany({
      where: { polizaId },
      orderBy: { numero: 'asc' },
    });
    return filas.map((fila) => ({
      id: fila.id,
      numero: fila.numero,
      valor: fila.valor.toFixed(2),
      valorPagado: fila.valorPagado.toFixed(2),
      fechaVencimiento: fila.fechaVencimiento.toISOString().slice(0, 10),
      estado: fila.estado,
    }));
  }

  /**
   * Único borrado del sistema (ADR-020): las cuotas sin aplicaciones no son evidencia.
   * ponytail: techo, reemplazo completo del plan; salida, versionar planes si el negocio pide
   * historial.
   */
  async reemplazarCuotas(polizaId: string, cuotas: CuotaDelPlan[]): Promise<Cuota[]> {
    await this.prisma.$transaction(async (tx) => {
      const editable = await tx.poliza.count({
        where: { id: polizaId, estado: 'VIGENTE', pagos: { none: { estado: 'VALIDADO' } } },
      });
      if (editable === 0) {
        throw planConPagosValidados();
      }
      await this.escribirCuotas(tx, polizaId, cuotas);
    });
    return this.listarCuotas(polizaId);
  }

  async marcarCuotasVencidas(hoy: string): Promise<number> {
    const { count } = await this.prisma.cuota.updateMany({
      where: { estado: { in: ['PENDIENTE', 'PARCIAL'] }, fechaVencimiento: { lt: aFecha(hoy) } },
      data: { estado: 'VENCIDA' },
    });
    return count;
  }

  private async escribirPoliza(
    cliente: Prisma.TransactionClient,
    id: string,
    datos: DatosActualizarPoliza,
  ): Promise<number> {
    const { count } = await cliente.poliza.updateMany({
      where: {
        id,
        estado: 'VIGENTE',
        ...(datos.primaTotal !== undefined ? { pagos: { none: { estado: 'VALIDADO' } } } : {}),
      },
      data: {
        ...datos,
        ...(datos.fechaInicio ? { fechaInicio: aFecha(datos.fechaInicio) } : {}),
        ...(datos.fechaFin ? { fechaFin: aFecha(datos.fechaFin) } : {}),
      },
    });
    return count;
  }

  private async escribirCuotas(
    tx: Prisma.TransactionClient,
    polizaId: string,
    cuotas: CuotaDelPlan[],
  ): Promise<void> {
    await tx.cuota.deleteMany({ where: { polizaId } });
    await tx.cuota.createMany({
      data: cuotas.map((c) => ({
        polizaId,
        numero: c.numero,
        valor: c.valor,
        fechaVencimiento: aFecha(c.fechaVencimiento),
      })),
    });
  }

  async cambiarEstado(id: string, estado: EstadoPoliza): Promise<Poliza> {
    const { count } = await this.prisma.poliza.updateMany({
      where: { id, estado: 'VIGENTE' },
      data: { estado },
    });
    return this.releerTrasEscribir(id, count);
  }

  async existeNumero(numero: string, exceptoId?: string): Promise<boolean> {
    const fila = await this.prisma.poliza.findUnique({ where: { numero } });
    return fila !== null && fila.id !== exceptoId;
  }

  async buscarClienteParaPoliza(id: string): Promise<{ activo: boolean } | null> {
    return this.prisma.cliente.findUnique({ where: { id }, select: { activo: true } });
  }

  async existeAseguradora(id: string): Promise<boolean> {
    const fila = await this.prisma.aseguradora.findUnique({ where: { id }, select: { id: true } });
    return fila !== null;
  }

  async buscarRamoActivoPorId(id: string): Promise<RamoResumen | null> {
    return this.prisma.ramo.findFirst({
      where: { id, activo: true },
      select: CAMPOS_RAMO,
    });
  }

  async listarRamosActivos(): Promise<RamoResumen[]> {
    return this.prisma.ramo.findMany({
      where: { activo: true },
      select: CAMPOS_RAMO,
      orderBy: { nombre: 'asc' },
    });
  }

  private async releerTrasEscribir(id: string, filasEscritas: number): Promise<Poliza> {
    if (filasEscritas === 0) {
      throw new ConflictoError(
        'La póliza cambió mientras se editaba; recargue e intente de nuevo',
        {
          motivo: 'POLIZA_MODIFICADA',
        },
      );
    }
    const fila = await this.prisma.poliza.findUniqueOrThrow({
      where: { id },
      include: INCLUIR_POLIZA,
    });
    return this.mapear(fila);
  }

  private mapear(fila: FilaPoliza): Poliza {
    return Poliza.reconstituir({
      id: fila.id,
      numero: fila.numero,
      clienteId: fila.clienteId,
      aseguradoraId: fila.aseguradoraId,
      ramoId: fila.ramoId,
      ramo: fila.ramo.nombre,
      primaTotal: fila.primaTotal.toString(),
      fechaInicio: fila.fechaInicio.toISOString().slice(0, 10),
      fechaFin: fila.fechaFin.toISOString().slice(0, 10),
      estado: fila.estado,
      tienePagosValidados: fila._count.pagos > 0,
      enMora: fila._count.cuotas > 0,
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
