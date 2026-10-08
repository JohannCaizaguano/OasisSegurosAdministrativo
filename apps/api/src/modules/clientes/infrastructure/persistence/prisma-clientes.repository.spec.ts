import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaClientesRepository } from './prisma-clientes.repository';

describe('PrismaClientesRepository', () => {
  it('divide la búsqueda en palabras y exige que todas coincidan (D8)', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      cliente: { findMany, count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn((operaciones: Promise<unknown>[]) => Promise.all(operaciones)),
    };
    const repositorio = new PrismaClientesRepository(prisma as unknown as PrismaService);

    await repositorio.listar({ q: 'juan pérez', activo: true, pagina: 1, porPagina: 20 });

    const consulta = findMany.mock.calls[0][0] as {
      where: { activo?: boolean; AND?: { OR: object[] }[] };
    };
    expect(consulta.where.activo).toBe(true);
    expect(consulta.where.AND).toHaveLength(2);
    for (const palabra of consulta.where.AND ?? []) {
      expect(palabra.OR).toEqual([
        { identificacion: { contains: expect.any(String), mode: 'insensitive' } },
        { nombres: { contains: expect.any(String), mode: 'insensitive' } },
        { apellidos: { contains: expect.any(String), mode: 'insensitive' } },
        { razonSocial: { contains: expect.any(String), mode: 'insensitive' } },
        { email: { contains: expect.any(String), mode: 'insensitive' } },
      ]);
    }
    const palabras = (consulta.where.AND ?? []).map(
      (condicion) =>
        (condicion.OR[0] as { identificacion: { contains: string } }).identificacion.contains,
    );
    expect(palabras).toEqual(['juan', 'pérez']);
  });

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
