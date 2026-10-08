import type { PagosRepositoryPort } from '../ports/pagos.repository.port';
import { ListarPagosDeClienteUseCase } from './listar-pagos-de-cliente.use-case';

function crearRepo(): PagosRepositoryPort {
  return {
    crear: jest.fn(),
    listar: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    buscarPorId: jest.fn(),
    validarYCrearRecibo: jest.fn(),
    rechazar: jest.fn(),
    buscarMetodoPago: jest.fn(),
    estadoPoliza: jest.fn(),
  };
}

describe('ListarPagosDeClienteUseCase', () => {
  it('sin clienteId lanza ProhibidoError', () => {
    const caso = new ListarPagosDeClienteUseCase(crearRepo());

    expect(() => caso.ejecutar(null, { pagina: 1, porPagina: 20 })).toThrow(
      expect.objectContaining({ codigo: 'PROHIBIDO' }),
    );
    expect(() => caso.ejecutar(undefined, { pagina: 1, porPagina: 20 })).toThrow(
      expect.objectContaining({ codigo: 'PROHIBIDO' }),
    );
  });

  it('filtra por el clienteId del usuario', async () => {
    const repo = crearRepo();
    const caso = new ListarPagosDeClienteUseCase(repo);

    await caso.ejecutar('cliente-1', { pagina: 1, porPagina: 20, estado: 'VALIDADO' });

    expect(repo.listar).toHaveBeenCalledWith({
      pagina: 1,
      porPagina: 20,
      estado: 'VALIDADO',
      clienteId: 'cliente-1',
    });
  });
});
