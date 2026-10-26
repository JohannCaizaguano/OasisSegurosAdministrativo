import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { DatosValidarPago } from '../../application/ports/pagos.repository.port';
import { PrismaPagosRepository } from './prisma-pagos.repository';

const POLIZA_ID = '11111111-1111-1111-1111-111111111111';
const PAGO_ID = '22222222-2222-2222-2222-222222222222';

const FILA_PAGO = {
  id: PAGO_ID,
  polizaId: POLIZA_ID,
  monto: new Prisma.Decimal('50.00'),
  fechaPago: new Date('2026-10-01T00:00:00.000Z'),
  metodoPagoId: 'metodo-1',
  metodoPago: { codigo: 'TRANSFERENCIA' },
  referencia: 'TRF-1',
  estado: 'VALIDADO' as const,
  registradoPorId: null,
  validadoPorId: 'operador-1',
  validadoEn: new Date('2026-10-02T15:00:00.000Z'),
  rechazadoPorId: null,
  rechazadoEn: null,
  motivoRechazo: null,
  nota: null,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-02T15:00:00.000Z'),
  poliza: { numero: 'POL-1' },
  recibo: null,
};

function cuota(numero: number, valor: string, fecha: string, valorPagado = '0.00') {
  return {
    id: `cuota-${numero}`,
    numero,
    valor: new Prisma.Decimal(valor),
    valorPagado: new Prisma.Decimal(valorPagado),
    fechaVencimiento: new Date(`${fecha}T00:00:00.000Z`),
    estado: 'PENDIENTE',
  };
}

const DATOS: DatosValidarPago = {
  pagoId: PAGO_ID,
  validadoPorId: 'operador-1',
  // 10:00 en Guayaquil del 2 de octubre.
  validadoEn: new Date('2026-10-02T15:00:00.000Z'),
  nota: null,
  recibo: {
    id: '33333333-3333-3333-3333-333333333333',
    codigo: 'RC-ABC123ABC123',
    pagoId: PAGO_ID,
    idOnchain: `0x${'11'.repeat(32)}`,
    hashRecibo: `0x${'22'.repeat(32)}`,
    sal: `0x${'33'.repeat(32)}`,
    payloadCanonico: '{}',
    chainId: 80002,
    contractAddress: '0x0000000000000000000000000000000000000009',
    creadoEn: '2026-10-02T15:00:00.000Z',
  },
};

function crearTx(cuotas: ReturnType<typeof cuota>[]) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue(cuotas),
    pago: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(FILA_PAGO),
    },
    aplicacionPago: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    cuota: { update: jest.fn().mockResolvedValue({}) },
    recibo: {
      create: jest.fn().mockResolvedValue({
        ...DATOS.recibo,
        creadoEn: new Date(DATOS.recibo.creadoEn),
        estado: 'PENDIENTE_ANCLAJE',
        txHash: null,
        blockNumber: null,
        gasUsed: null,
        effectiveGasPrice: null,
        intentos: 0,
        ultimoError: null,
        enviadoEn: null,
        ancladoEn: null,
        pago: { poliza: { numero: 'POL-1', clienteId: 'c1' } },
      }),
    },
  };
  const prisma = {
    $transaction: jest.fn(async (fn: (cliente: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { tx, repo: new PrismaPagosRepository(prisma as unknown as PrismaService) };
}

describe('PrismaPagosRepository.validarYCrearRecibo: aplicación a cuotas (HU-36, D12)', () => {
  it('bloquea las cuotas de la póliza con FOR UPDATE antes de aplicar', async () => {
    const { tx, repo } = crearTx([cuota(1, '100.00', '2026-11-01')]);

    await repo.validarYCrearRecibo(DATOS);

    const [plantilla, ...valores] = tx.$queryRaw.mock.calls[0] as [TemplateStringsArray, unknown];
    expect(plantilla.join('?')).toMatch(/FROM "Cuota"[\s\S]*FOR UPDATE/);
    expect(valores).toContain(POLIZA_ID);
  });

  it('aplica 50 sobre 33,33/33,33/33,34: la primera PAGADA y 16,67 a la segunda (PARCIAL)', async () => {
    const { tx, repo } = crearTx([
      cuota(2, '33.33', '2026-11-01'),
      cuota(1, '33.33', '2026-10-15'),
      cuota(3, '33.34', '2026-12-01'),
    ]);

    await repo.validarYCrearRecibo(DATOS);

    expect(tx.aplicacionPago.createMany).toHaveBeenCalledWith({
      data: [
        { pagoId: PAGO_ID, cuotaId: 'cuota-1', monto: '33.33' },
        { pagoId: PAGO_ID, cuotaId: 'cuota-2', monto: '16.67' },
      ],
    });
    expect(tx.cuota.update).toHaveBeenCalledWith({
      where: { id: 'cuota-1' },
      data: { valorPagado: '33.33', estado: 'PAGADA' },
    });
    expect(tx.cuota.update).toHaveBeenCalledWith({
      where: { id: 'cuota-2' },
      data: { valorPagado: '16.67', estado: 'PARCIAL' },
    });
    expect(tx.cuota.update).toHaveBeenCalledTimes(2);
  });

  it('una cuota ya vencida cubierta en parte queda VENCIDA (hoy de Guayaquil)', async () => {
    const { tx, repo } = crearTx([cuota(1, '100.00', '2026-10-01')]);

    await repo.validarYCrearRecibo(DATOS);

    expect(tx.cuota.update).toHaveBeenCalledWith({
      where: { id: 'cuota-1' },
      data: { valorPagado: '50.00', estado: 'VENCIDA' },
    });
  });

  it('con lo bloqueado, si el monto supera lo pendiente responde 422 MONTO_SUPERA_SALDO y no emite', async () => {
    const { tx, repo } = crearTx([cuota(1, '100.00', '2026-11-01', '60.00')]);

    await expect(repo.validarYCrearRecibo(DATOS)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'monto', motivo: 'MONTO_SUPERA_SALDO', saldo: '40.00' },
    });
    expect(tx.recibo.create).not.toHaveBeenCalled();
    expect(tx.aplicacionPago.createMany).not.toHaveBeenCalled();
  });
});

describe('PrismaPagosRepository.validarYCrearRecibo: orden (revisión T20)', () => {
  it('con el pago ya validado responde el error de estado, no MONTO_SUPERA_SALDO, y no bloquea cuotas', async () => {
    const { tx, repo } = crearTx([cuota(1, '100.00', '2026-11-01', '100.00')]);
    tx.pago.updateMany.mockResolvedValue({ count: 0 });

    await expect(repo.validarYCrearRecibo(DATOS)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      message: 'El pago ya fue validado o rechazado',
    });
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.recibo.create).not.toHaveBeenCalled();
  });
});

describe('PrismaPagosRepository.buscarDetalle (D14)', () => {
  it('devuelve el pago con sus aplicaciones por número de cuota y su recibo', async () => {
    const prisma = {
      pago: {
        findUnique: jest.fn().mockResolvedValue({
          ...FILA_PAGO,
          recibo: { id: 'r1', codigo: 'RC-ABC123ABC123', estado: 'ANCLADO' },
          aplicaciones: [
            { monto: new Prisma.Decimal('33.33'), cuota: { numero: 1 } },
            { monto: new Prisma.Decimal('16.67'), cuota: { numero: 2 } },
          ],
        }),
      },
    };
    const repo = new PrismaPagosRepository(prisma as unknown as PrismaService);

    const detalle = await repo.buscarDetalle(PAGO_ID);

    expect(detalle?.aplicaciones).toEqual([
      { cuotaNumero: 1, monto: '33.33' },
      { cuotaNumero: 2, monto: '16.67' },
    ]);
    expect(detalle?.pago.recibo).toEqual({
      id: 'r1',
      codigo: 'RC-ABC123ABC123',
      estado: 'ANCLADO',
    });
    expect(prisma.pago.findUnique).toHaveBeenCalledTimes(1);
  });

  it('devuelve null si el pago no existe', async () => {
    const prisma = { pago: { findUnique: jest.fn().mockResolvedValue(null) } };
    const repo = new PrismaPagosRepository(prisma as unknown as PrismaService);

    await expect(repo.buscarDetalle(PAGO_ID)).resolves.toBeNull();
  });
});
