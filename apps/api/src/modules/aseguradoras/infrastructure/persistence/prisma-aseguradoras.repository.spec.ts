import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaAseguradorasRepository } from './prisma-aseguradoras.repository';

describe('PrismaAseguradorasRepository', () => {
  it('traduce el P2002 al crear en un 409 en el campo ruc', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('único', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const prisma = { aseguradora: { create: jest.fn().mockRejectedValue(p2002) } };
    const repositorio = new PrismaAseguradorasRepository(prisma as unknown as PrismaService);

    await expect(
      repositorio.crear({ nombre: 'Aseguradora Carrera', ruc: '1790012345001' }),
    ).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'ruc', motivo: 'RUC_DUPLICADO' },
    });
  });
});
