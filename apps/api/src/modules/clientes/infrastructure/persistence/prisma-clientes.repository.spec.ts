import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaClientesRepository } from './prisma-clientes.repository';

describe('PrismaClientesRepository', () => {
  it('traduce el P2002 al crear en un 409 en el campo identificacion', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('único', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const prisma = { cliente: { create: jest.fn().mockRejectedValue(p2002) } };
    const repositorio = new PrismaClientesRepository(prisma as unknown as PrismaService);

    await expect(
      repositorio.crear({
        tipoIdentificacion: 'CEDULA',
        identificacion: '1710034065',
        nombres: 'Ana',
        apellidos: 'Pérez',
        email: 'ana@example.com',
      }),
    ).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'identificacion', motivo: 'IDENTIFICACION_DUPLICADA' },
    });
  });
});
