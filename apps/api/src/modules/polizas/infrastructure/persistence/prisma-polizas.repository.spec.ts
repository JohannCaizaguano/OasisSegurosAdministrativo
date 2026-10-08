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
});
