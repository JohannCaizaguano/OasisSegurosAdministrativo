import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaRecibosRepository } from './prisma-recibos.repository';

const FILA = {
  codigo: 'RC-ABC123ABC123',
  estado: 'ANCLADO' as const,
  creadoEn: new Date('2026-09-01T12:00:00.000Z'),
  ancladoEn: new Date('2026-09-01T12:00:20.000Z'),
  txHash: `0x${'aa'.repeat(32)}`,
  pago: {
    monto: new Prisma.Decimal('120.1'),
    fechaPago: new Date('2026-09-01T00:00:00.000Z'),
    referencia: 'TRF-1',
    metodoPago: { codigo: 'TRANSFERENCIA' },
    poliza: {
      numero: 'POL-1',
      clienteId: '44444444-4444-4444-4444-444444444444',
      ramo: { nombre: 'Vehículos' },
      aseguradora: { nombre: 'Aseguradora del Pacífico C.A.' },
      cliente: {
        identificacion: '1790012345001',
        nombres: null,
        apellidos: null,
        razonSocial: 'Comercial Andina S.A.',
      },
    },
  },
};

describe('PrismaRecibosRepository.buscarImprimible (HU-25)', () => {
  it('lee pago, póliza, ramo, aseguradora y cliente en una sola consulta', async () => {
    const prisma = { recibo: { findUnique: jest.fn().mockResolvedValue(FILA) } };
    const repo = new PrismaRecibosRepository(prisma as unknown as PrismaService);

    const datos = await repo.buscarImprimible('id-1');

    expect(prisma.recibo.findUnique).toHaveBeenCalledTimes(1);
    expect(datos).toEqual({
      codigo: 'RC-ABC123ABC123',
      estado: 'ANCLADO',
      creadoEn: '2026-09-01T12:00:00.000Z',
      ancladoEn: '2026-09-01T12:00:20.000Z',
      txHash: FILA.txHash,
      pago: {
        monto: '120.10',
        fechaPago: '2026-09-01',
        metodo: 'TRANSFERENCIA',
        referencia: 'TRF-1',
      },
      poliza: {
        numero: 'POL-1',
        ramo: 'Vehículos',
        aseguradora: 'Aseguradora del Pacífico C.A.',
        clienteId: '44444444-4444-4444-4444-444444444444',
      },
      cliente: { nombre: 'Comercial Andina S.A.', identificacion: '1790012345001' },
    });
  });

  it('devuelve null si el recibo no existe', async () => {
    const prisma = { recibo: { findUnique: jest.fn().mockResolvedValue(null) } };
    const repo = new PrismaRecibosRepository(prisma as unknown as PrismaService);

    await expect(repo.buscarImprimible('id-1')).resolves.toBeNull();
  });
});
