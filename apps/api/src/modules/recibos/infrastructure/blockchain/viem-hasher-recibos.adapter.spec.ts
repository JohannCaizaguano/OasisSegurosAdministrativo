import { serializarCanonico, type PayloadRecibo } from '../../domain/payload-recibo';
import { ViemHasherRecibosAdapter } from './viem-hasher-recibos.adapter';

const SAL_A = `0x${'aa'.repeat(32)}`;
const SAL_B = `0x${'bb'.repeat(32)}`;

const payload: PayloadRecibo = {
  codigo: 'RC-ABC123',
  pagoId: '11111111-1111-1111-1111-111111111111',
  numeroPoliza: 'POL-2026-0001',
  monto: '120.13',
  moneda: 'USD',
  fechaPago: '2026-09-01',
  emitidoEn: '2026-09-01T12:00:00.000Z',
};

describe('ViemHasherRecibosAdapter', () => {
  const hasher = new ViemHasherRecibosAdapter();
  const canonico = serializarCanonico(payload);

  it('calcula un hash bytes32 y conserva la sal', () => {
    const hash = hasher.hashRecibo(canonico, SAL_A);
    expect(hash.hash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(hash.sal).toBe(SAL_A);
  });

  it('es determinista para el mismo payload y sal', () => {
    expect(hasher.hashRecibo(canonico, SAL_A).hash).toBe(hasher.hashRecibo(canonico, SAL_A).hash);
  });

  it('cambia de hash si cambia la sal', () => {
    expect(hasher.hashRecibo(canonico, SAL_A).hash).not.toBe(
      hasher.hashRecibo(canonico, SAL_B).hash,
    );
  });

  it('cambia de hash si cambia un solo campo del payload', () => {
    expect(
      hasher.hashRecibo(serializarCanonico({ ...payload, monto: '120.14' }), SAL_A).hash,
    ).not.toBe(hasher.hashRecibo(canonico, SAL_A).hash);
  });

  it('recalcula el mismo hash desde el payload canónico guardado', () => {
    const original = hasher.hashRecibo(canonico, SAL_A);
    const recalculado = hasher.hashRecibo(canonico, SAL_A);
    expect(recalculado.hash).toBe(original.hash);
  });

  it('hashTexto deriva idOnchain estable del uuid', () => {
    const id = '22222222-2222-2222-2222-222222222222';
    expect(hasher.hashTexto(id)).toMatch(/^0x[0-9a-f]{64}$/);
    expect(hasher.hashTexto(id)).toBe(hasher.hashTexto(id));
    expect(hasher.hashTexto(id)).not.toBe(hasher.hashTexto(`${id}-otro`));
  });
});
