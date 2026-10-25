import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaPolizasRepository } from './prisma-polizas.repository';

const DATOS = {
  numero: 'POL-001',
  clienteId: '22222222-2222-2222-2222-222222222222',
  aseguradoraId: '33333333-3333-3333-3333-333333333333',
  ramoId: '44444444-4444-4444-4444-444444444444',
  primaTotal: '1500.50',
  fechaInicio: '2026-01-01',
  fechaFin: '2026-12-31',
};

function p2002(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('único', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

describe('PrismaPolizasRepository', () => {
  it('traduce el P2002 al crear en un 409 NUMERO_DUPLICADO (D9)', async () => {
    const prisma = { poliza: { create: jest.fn().mockRejectedValue(p2002()) } };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);

    await expect(repositorio.crear(DATOS)).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'numero', motivo: 'NUMERO_DUPLICADO' },
    });
  });

  it('traduce el P2002 al actualizar el número en el mismo 409 (D11)', async () => {
    const prisma = { poliza: { updateMany: jest.fn().mockRejectedValue(p2002()) } };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);

    await expect(repositorio.actualizar('1', { numero: 'POL-002' })).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'numero', motivo: 'NUMERO_DUPLICADO' },
    });
  });

  it('409 POLIZA_MODIFICADA si la póliza dejó de estar vigente antes de escribir', async () => {
    const prisma = { poliza: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) } };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);

    await expect(repositorio.cambiarEstado('1', 'CANCELADA')).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { motivo: 'POLIZA_MODIFICADA' },
    });
    expect(prisma.poliza.updateMany).toHaveBeenCalledWith({
      where: { id: '1', estado: 'VIGENTE' },
      data: { estado: 'CANCELADA' },
    });
  });

  it('al cambiar la prima exige que no haya pagos validados en la misma escritura', async () => {
    const prisma = { poliza: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) } };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);

    await expect(repositorio.actualizar('1', { primaTotal: '10.00' })).rejects.toMatchObject({
      detalles: { motivo: 'POLIZA_MODIFICADA' },
    });
    expect(prisma.poliza.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1', estado: 'VIGENTE', pagos: { none: { estado: 'VALIDADO' } } },
      }),
    );
  });

  it('crea la póliza con su cuota única por la prima, en la misma escritura (D11)', async () => {
    const prisma = { poliza: { create: jest.fn().mockResolvedValue(FILA) } };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);

    await repositorio.crear(DATOS);

    expect(prisma.poliza.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cuotas: {
            create: {
              numero: 1,
              valor: '1500.50',
              fechaVencimiento: new Date('2026-01-01T00:00:00.000Z'),
            },
          },
        }),
      }),
    );
  });

  it('enMora sale del _count de cuotas VENCIDAS de la misma consulta (D15)', async () => {
    const prisma = {
      poliza: {
        findUnique: jest.fn().mockResolvedValue({ ...FILA, _count: { pagos: 0, cuotas: 1 } }),
      },
    };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);

    const poliza = await repositorio.buscarPorId('1');

    expect(poliza?.enMora).toBe(true);
    expect(prisma.poliza.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          _count: {
            select: {
              pagos: { where: { estado: 'VALIDADO' } },
              cuotas: { where: { estado: 'VENCIDA' } },
            },
          },
        }),
      }),
    );
  });

  it('marca VENCIDA toda cuota PENDIENTE o PARCIAL vencida antes de hoy, en un updateMany (D14)', async () => {
    const prisma = { cuota: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) } };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);

    await expect(repositorio.marcarCuotasVencidas('2026-10-24')).resolves.toBe(2);
    expect(prisma.cuota.updateMany).toHaveBeenCalledWith({
      where: {
        estado: { in: ['PENDIENTE', 'PARCIAL'] },
        fechaVencimiento: { lt: new Date('2026-10-24T00:00:00.000Z') },
      },
      data: { estado: 'VENCIDA' },
    });
  });

  it('reemplaza el plan dentro de una transacción que vuelve a exigir cero pagos validados', async () => {
    const tx = {
      poliza: { count: jest.fn().mockResolvedValue(1) },
      cuota: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
      cuota: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);
    const cuotas = [{ numero: 1, valor: '1500.50', fechaVencimiento: '2026-01-01' }];

    await repositorio.reemplazarCuotas('1', cuotas);

    expect(tx.poliza.count).toHaveBeenCalledWith({
      where: { id: '1', estado: 'VIGENTE', pagos: { none: { estado: 'VALIDADO' } } },
    });
    expect(tx.cuota.deleteMany).toHaveBeenCalledWith({ where: { polizaId: '1' } });
    expect(tx.cuota.createMany).toHaveBeenCalledWith({
      data: [
        {
          polizaId: '1',
          numero: 1,
          valor: '1500.50',
          fechaVencimiento: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    });
  });

  it('422 PLAN_CON_PAGOS_VALIDADOS si un pago se validó antes de reemplazar', async () => {
    const tx = {
      poliza: { count: jest.fn().mockResolvedValue(0) },
      cuota: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
    const repositorio = new PrismaPolizasRepository(prisma as unknown as PrismaService);

    await expect(
      repositorio.reemplazarCuotas('1', [
        { numero: 1, valor: '1.00', fechaVencimiento: '2026-01-01' },
      ]),
    ).rejects.toMatchObject({ detalles: { motivo: 'PLAN_CON_PAGOS_VALIDADOS' } });
    expect(tx.cuota.deleteMany).not.toHaveBeenCalled();
  });
});

const FILA = {
  id: '1',
  numero: 'POL-001',
  clienteId: DATOS.clienteId,
  aseguradoraId: DATOS.aseguradoraId,
  ramoId: DATOS.ramoId,
  ramo: { nombre: 'Vida' },
  primaTotal: '1500.50',
  fechaInicio: new Date('2026-01-01T00:00:00.000Z'),
  fechaFin: new Date('2026-12-31T00:00:00.000Z'),
  estado: 'VIGENTE' as const,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  _count: { pagos: 0, cuotas: 0 },
};
