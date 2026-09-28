import { ReglaNegocioError } from '../../../shared-kernel/domain-error';
import { Recibo, type DatosNuevoRecibo } from './recibo';

function datosNuevoRecibo(): DatosNuevoRecibo {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    codigo: 'RC-ABC123',
    pagoId: '22222222-2222-2222-2222-222222222222',
    idOnchain: `0x${'11'.repeat(32)}`,
    hashRecibo: `0x${'22'.repeat(32)}`,
    sal: `0x${'33'.repeat(32)}`,
    payloadCanonico: '{"codigo":"RC-ABC123"}',
    chainId: 31337,
    contractAddress: '0x0000000000000000000000000000000000000001',
    creadoEn: '2026-09-01T12:00:00.000Z',
  };
}

describe('Recibo', () => {
  it('nace en PENDIENTE_ANCLAJE con intentos en cero', () => {
    const recibo = Recibo.nuevo(datosNuevoRecibo());
    expect(recibo.estado).toBe('PENDIENTE_ANCLAJE');
    expect(recibo.intentos).toBe(0);
    expect(recibo.estaAnclado()).toBe(false);
  });

  it('transiciona PENDIENTE -> ENVIADO -> ANCLADO', () => {
    const recibo = Recibo.nuevo(datosNuevoRecibo());
    recibo.marcarEnviado(`0x${'44'.repeat(32)}`, new Date('2026-09-01T12:01:00.000Z'));
    expect(recibo.estado).toBe('ENVIADO');
    expect(recibo.enviadoEn).toBe('2026-09-01T12:01:00.000Z');

    recibo.marcarAnclado(
      { blockNumber: '100', gasUsed: '21000', effectiveGasPrice: '1000000000' },
      new Date('2026-09-01T12:02:00.000Z'),
    );
    expect(recibo.estado).toBe('ANCLADO');
    expect(recibo.blockNumber).toBe('100');
    expect(recibo.ancladoEn).toBe('2026-09-01T12:02:00.000Z');
  });

  it('no permite marcar fallido un recibo anclado', () => {
    const recibo = Recibo.nuevo(datosNuevoRecibo());
    recibo.marcarAnclado({ blockNumber: null, gasUsed: null, effectiveGasPrice: null }, new Date());
    expect(() => recibo.marcarFallido('boom')).toThrow(ReglaNegocioError);
  });

  it('acumula intentos y guarda el último error', () => {
    const recibo = Recibo.nuevo(datosNuevoRecibo());
    recibo.registrarIntento('timeout');
    recibo.registrarIntento('timeout 2');
    expect(recibo.intentos).toBe(2);
    expect(recibo.ultimoError).toBe('timeout 2');
  });

  it('reintentar solo es válido desde FALLIDO', () => {
    const recibo = Recibo.nuevo(datosNuevoRecibo());
    expect(() => recibo.reintentar()).toThrow(ReglaNegocioError);

    recibo.marcarFallido('sin fondos');
    recibo.reintentar();
    expect(recibo.estado).toBe('PENDIENTE_ANCLAJE');
    expect(recibo.ultimoError).toBeNull();
  });

  it('anular es idempotente a nivel de dominio', () => {
    const recibo = Recibo.nuevo(datosNuevoRecibo());
    recibo.anular();
    expect(recibo.estado).toBe('ANULADO');
    expect(() => recibo.anular()).toThrow(ReglaNegocioError);
  });
});
