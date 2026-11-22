import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaBitacoraRepository } from './prisma-bitacora.repository';

function crear() {
  const prisma = {
    bitacoraAuditoria: {
      findMany: jest.fn().mockReturnValue([]),
      count: jest.fn().mockReturnValue(0),
    },
    $transaction: jest.fn((consultas: unknown[]) => Promise.all(consultas)),
  };
  return { prisma, repo: new PrismaBitacoraRepository(prisma as unknown as PrismaService) };
}

describe('PrismaBitacoraRepository.listar (D10)', () => {
  it('con entidad y entidadId, el where los incluye en la lista y en el conteo', async () => {
    const { prisma, repo } = crear();

    await repo.listar({
      pagina: 1,
      porPagina: 1,
      entidad: 'Recibo',
      entidadId: 'r1',
      accion: 'REINTENTAR',
    });

    const where = {
      usuarioId: undefined,
      accion: 'REINTENTAR',
      entidad: 'Recibo',
      entidadId: 'r1',
      creadoEn: undefined,
    };
    expect(prisma.bitacoraAuditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(prisma.bitacoraAuditoria.count).toHaveBeenCalledWith({ where });
  });

  it('sin esos filtros el where queda igual', async () => {
    const { prisma, repo } = crear();

    await repo.listar({ pagina: 1, porPagina: 20 });

    const { where } = prisma.bitacoraAuditoria.count.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(where.entidad).toBeUndefined();
    expect(where.entidadId).toBeUndefined();
  });
});
