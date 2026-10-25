import { Pago, type PropsPago } from './pago';

const PROPS: PropsPago = {
  id: '22222222-2222-2222-2222-222222222222',
  polizaId: '11111111-1111-1111-1111-111111111111',
  monto: '100.00',
  fechaPago: '2026-10-01',
  metodoPagoId: 'metodo-1',
  metodo: 'DEBITO_BANCARIO',
  referencia: 'DB-1',
  estado: 'REGISTRADO',
  registradoPorId: null,
  validadoPorId: null,
  validadoEn: null,
  rechazadoPorId: null,
  rechazadoEn: null,
  motivoRechazo: null,
  nota: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('Pago.puedeEditarse (HU-18, D9)', () => {
  it('solo un pago REGISTRADO admite edición', () => {
    expect(Pago.reconstituir(PROPS).puedeEditarse()).toBe(true);
  });

  it.each(['VALIDADO', 'RECHAZADO'] as const)('un pago %s no se puede editar', (estado) => {
    expect(Pago.reconstituir({ ...PROPS, estado }).puedeEditarse()).toBe(false);
  });
});
