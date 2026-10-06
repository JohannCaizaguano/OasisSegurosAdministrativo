import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaUsuariosRepository } from './prisma-usuarios.repository';

describe('PrismaUsuariosRepository', () => {
  it('traduce el P2002 al crear en un 409 en el campo email', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('único', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const prisma = { usuario: { create: jest.fn().mockRejectedValue(p2002) } };
    const repositorio = new PrismaUsuariosRepository(prisma as unknown as PrismaService);

    await expect(
      repositorio.crear({
        email: 'carrera@oasis.com',
        nombre: 'Carrera',
        rol: 'OPERADOR',
        passwordHash: 'hash',
      }),
    ).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'email', motivo: 'CORREO_DUPLICADO' },
    });
  });
});
