import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaPagosRepository } from './prisma-pagos.repository';

const FILA = {
  id: '22222222-2222-2222-2222-222222222222',
  polizaId: '11111111-1111-1111-1111-111111111111',
  monto: new Prisma.Decimal('100.00'),
  fechaPago: new Date('2026-10-01T00:00:00.000Z'),
  metodoPagoId: 'metodo-1',
  metodoPago: { codigo: 'DEBITO_BANCARIO' },
  referencia: 'DB-1',
  estado: 'RECHAZADO' as const,
  registradoPorId: null,
  validadoPorId: null,
  validadoEn: null,
  rechazadoPorId: 'operador-1',
  rechazadoEn: new Date('2026-10-02T10:00:00.000Z'),
  motivoRechazo: 'Pago duplicado',
  nota: null,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-02T10:00:00.000Z'),
};

describe('PrismaPagosRepository', () => {
  it('traduce el P2002 de (polizaId, referencia) en un 409 REFERENCIA_DUPLICADA (D6)', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('único', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const prisma = { pago: { create: jest.fn().mockRejectedValue(error) } };
    const repositorio = new PrismaPagosRepository(prisma as unknown as PrismaService);

    await expect(
      repositorio.crear({
        polizaId: FILA.polizaId,
        monto: '10.00',
        fechaPago: '2026-10-01',
        metodoPagoId: 'metodo-1',
        registradoPorId: null,
        referencia: 'DB-1',
      }),
    ).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'referencia', motivo: 'REFERENCIA_DUPLICADA' },
    });
  });

  it('rechazar guarda autor y fecha del rechazo sin tocar validadoPorId (D8)', async () => {
    const prisma = {
      pago: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(FILA),
      },
    };
    const repositorio = new PrismaPagosRepository(prisma as unknown as PrismaService);
    const cuando = new Date('2026-10-02T10:00:00.000Z');

    const pago = await repositorio.rechazar(FILA.id, 'operador-1', cuando, 'Pago duplicado');

    expect(prisma.pago.updateMany).toHaveBeenCalledWith({
      where: { id: FILA.id, estado: 'REGISTRADO' },
      data: {
        estado: 'RECHAZADO',
        rechazadoPorId: 'operador-1',
        rechazadoEn: cuando,
        motivoRechazo: 'Pago duplicado',
      },
    });
    expect(pago.rechazadoPorId).toBe('operador-1');
    expect(pago.rechazadoEn).toBe('2026-10-02T10:00:00.000Z');
    expect(pago.validadoPorId).toBeNull();
  });

  it('saldoPoliza = prima − Σ pagos VALIDADOS, con aggregate (D7)', async () => {
    const prisma = {
      poliza: {
        findUnique: jest.fn().mockResolvedValue({ primaTotal: new Prisma.Decimal('480.50') }),
      },
      pago: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { monto: new Prisma.Decimal('100.10') } }),
      },
    };
    const repositorio = new PrismaPagosRepository(prisma as unknown as PrismaService);

    await expect(repositorio.saldoPoliza(FILA.polizaId)).resolves.toBe('380.40');
    expect(prisma.pago.aggregate).toHaveBeenCalledWith({
      where: { polizaId: FILA.polizaId, estado: 'VALIDADO' },
      _sum: { monto: true },
    });
  });

  it('saldoPoliza devuelve la prima sin pagos validados y null si la póliza no existe', async () => {
    const prisma = {
      poliza: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ primaTotal: new Prisma.Decimal('480.5') })
          .mockResolvedValueOnce(null),
      },
      pago: { aggregate: jest.fn().mockResolvedValue({ _sum: { monto: null } }) },
    };
    const repositorio = new PrismaPagosRepository(prisma as unknown as PrismaService);

    await expect(repositorio.saldoPoliza('a')).resolves.toBe('480.50');
    await expect(repositorio.saldoPoliza('b')).resolves.toBeNull();
  });

  it('lista primero lo más reciente: fecha de pago y, a igual fecha, el último registrado', async () => {
    const prisma = {
      pago: { findMany: jest.fn().mockReturnValue([]), count: jest.fn().mockReturnValue(0) },
      $transaction: jest.fn((consultas: unknown[]) => Promise.all(consultas)),
    };
    const repositorio = new PrismaPagosRepository(prisma as unknown as PrismaService);

    await repositorio.listar({ pagina: 1, porPagina: 20 });

    expect(prisma.pago.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ fechaPago: 'desc' }, { createdAt: 'desc' }] }),
    );
  });
});
