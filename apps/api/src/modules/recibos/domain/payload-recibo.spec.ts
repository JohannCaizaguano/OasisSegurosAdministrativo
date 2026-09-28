import { serializarCanonico, type PayloadRecibo } from './payload-recibo';

const payload: PayloadRecibo = {
  codigo: 'RC-ABC123',
  pagoId: '11111111-1111-1111-1111-111111111111',
  numeroPoliza: 'POL-2026-0001',
  monto: '120.13',
  moneda: 'USD',
  fechaPago: '2026-09-01',
  emitidoEn: '2026-09-01T12:00:00.000Z',
};

describe('serializarCanonico', () => {
  it('produce siempre el mismo texto para el mismo payload', () => {
    expect(serializarCanonico(payload)).toBe(serializarCanonico({ ...payload }));
  });

  it('ordena las claves de forma determinista (RFC 8785)', () => {
    const canonico = serializarCanonico(payload);
    const claves = Object.keys(JSON.parse(canonico));
    expect(claves).toEqual([...claves].sort());
  });

  it('no depende del orden de inserción de las propiedades', () => {
    const reordenado = {
      emitidoEn: payload.emitidoEn,
      fechaPago: payload.fechaPago,
      moneda: payload.moneda,
      monto: payload.monto,
      numeroPoliza: payload.numeroPoliza,
      pagoId: payload.pagoId,
      codigo: payload.codigo,
    } as PayloadRecibo;
    expect(serializarCanonico(reordenado)).toBe(serializarCanonico(payload));
  });

  it('cambia si cambia cualquier valor', () => {
    expect(serializarCanonico({ ...payload, monto: '120.14' })).not.toBe(
      serializarCanonico(payload),
    );
  });
});
