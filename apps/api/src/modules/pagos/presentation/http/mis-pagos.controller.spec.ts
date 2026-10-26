import { pagoClienteSchema } from '@oasis/shared';

import type { UsuarioAutenticado } from '../../../../common/auth/decorators';
import type { ListarPagosDeClienteUseCase } from '../../application/use-cases/listar-pagos-de-cliente.use-case';
import { Pago, type PropsPago } from '../../domain/pago';
import { MisPagosController } from './pagos.controller';

const BASE: PropsPago = {
  id: '2a6f0c1e-7d3b-4c2a-9e1f-0b5d8a7c6e41',
  polizaId: '8c2d4e6f-1a3b-4c5d-8e7f-9a0b1c2d3e4f',
  numeroPoliza: 'POL-1',
  monto: '100.00',
  fechaPago: '2026-10-01',
  metodoPagoId: 'metodo-1',
  metodo: 'TRANSFERENCIA',
  referencia: 'TRF-1',
  estado: 'VALIDADO',
  registradoPorId: null,
  validadoPorId: null,
  validadoEn: '2026-10-02T00:00:00.000Z',
  rechazadoPorId: null,
  rechazadoEn: null,
  motivoRechazo: null,
  nota: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-02T00:00:00.000Z',
  recibo: {
    id: '5e7f9a1b-2c3d-4e5f-a6b7-c8d9e0f1a2b3',
    codigo: 'RC-ABC123ABC123',
    estado: 'ANCLADO',
  },
};

const USUARIO: UsuarioAutenticado = {
  id: 'u1',
  email: 'cliente@oasis.com',
  rol: 'CLIENTE',
  clienteId: '44444444-4444-4444-4444-444444444444',
  sid: 's',
};

describe('MisPagosController (HU-25, D7)', () => {
  it('cada pago trae recibo { id, codigo } solo si está VALIDADO', async () => {
    const validado = Pago.reconstituir(BASE);
    const registrado = Pago.reconstituir({
      ...BASE,
      id: '0f1e2d3c-4b5a-4968-8776-655443322110',
      estado: 'REGISTRADO',
      validadoEn: null,
      recibo: null,
    });
    const listar = {
      ejecutar: jest.fn().mockResolvedValue({ items: [validado, registrado], total: 2 }),
    } as unknown as ListarPagosDeClienteUseCase;

    const respuesta = await new MisPagosController(listar).listar(USUARIO, {
      page: 1,
      pageSize: 20,
    });

    expect(respuesta.data.map((pago) => pago.recibo)).toEqual([
      { id: '5e7f9a1b-2c3d-4e5f-a6b7-c8d9e0f1a2b3', codigo: 'RC-ABC123ABC123' },
      null,
    ]);
    for (const pago of respuesta.data) {
      expect(pagoClienteSchema.safeParse(pago).success).toBe(true);
    }
  });
});
