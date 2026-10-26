import type { DetallePago, PagosRepositoryPort } from '../ports/pagos.repository.port';
import { ObtenerPagoUseCase } from './obtener-pago.use-case';

describe('ObtenerPagoUseCase (D14)', () => {
  it('devuelve el detalle del pago con sus aplicaciones', async () => {
    const detalle = { pago: { id: 'p1' }, aplicaciones: [] } as unknown as DetallePago;
    const pagos = {
      buscarDetalle: jest.fn().mockResolvedValue(detalle),
    } as unknown as PagosRepositoryPort;

    await expect(new ObtenerPagoUseCase(pagos).ejecutar('p1')).resolves.toBe(detalle);
  });

  it('404 si el pago no existe', async () => {
    const pagos = {
      buscarDetalle: jest.fn().mockResolvedValue(null),
    } as unknown as PagosRepositoryPort;

    await expect(new ObtenerPagoUseCase(pagos).ejecutar('p1')).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});
