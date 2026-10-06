import { Cliente } from '../../domain/cliente';
import type { ClientesRepositoryPort } from '../ports/clientes.repository.port';
import { ActualizarClienteUseCase, CrearClienteUseCase } from './clientes.use-cases';

const CLIENTE_ID = '33333333-3333-3333-3333-333333333333';

function crearCliente(parcial: Partial<Parameters<typeof Cliente.reconstituir>[0]> = {}) {
  return Cliente.reconstituir({
    id: CLIENTE_ID,
    tipoIdentificacion: 'CEDULA',
    identificacion: '1710034065',
    nombres: 'Ana',
    apellidos: 'Pérez',
    razonSocial: null,
    email: 'ana@example.com',
    telefono: null,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...parcial,
  });
}

function crearDobles(cliente: Cliente | null = crearCliente()) {
  const clientes: ClientesRepositoryPort = {
    crear: jest.fn().mockResolvedValue(cliente),
    listar: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(cliente),
    actualizar: jest.fn().mockResolvedValue(cliente),
    existeIdentificacion: jest.fn().mockResolvedValue(false),
  };
  return { clientes };
}

describe('CrearClienteUseCase', () => {
  it('rechaza una identificación duplicada con 409 en el campo identificacion', async () => {
    const deps = crearDobles();
    jest.mocked(deps.clientes.existeIdentificacion).mockResolvedValue(true);
    const caso = new CrearClienteUseCase(deps.clientes);

    await expect(
      caso.ejecutar({
        tipoIdentificacion: 'CEDULA',
        identificacion: '1710034065',
        nombres: 'Ana',
        apellidos: 'Pérez',
        email: 'ana@example.com',
      }),
    ).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'identificacion', motivo: 'IDENTIFICACION_DUPLICADA' },
    });
    expect(deps.clientes.crear).not.toHaveBeenCalled();
  });
});

describe('ActualizarClienteUseCase', () => {
  it('rechaza cambiar el tipo a RUC si la identificación guardada es una cédula', async () => {
    const deps = crearDobles();
    const caso = new ActualizarClienteUseCase(deps.clientes);

    await expect(caso.ejecutar(CLIENTE_ID, { tipoIdentificacion: 'RUC' })).rejects.toMatchObject({
      codigo: 'VALIDACION',
      detalles: [{ path: ['identificacion'] }],
    });
    expect(deps.clientes.actualizar).not.toHaveBeenCalled();
  });

  it('valida la combinación resultante y guarda la identificación normalizada', async () => {
    const deps = crearDobles(
      crearCliente({ tipoIdentificacion: 'PASAPORTE', identificacion: 'ab123' }),
    );
    const caso = new ActualizarClienteUseCase(deps.clientes);

    await caso.ejecutar(CLIENTE_ID, { identificacion: ' cd456 ' });

    expect(deps.clientes.actualizar).toHaveBeenCalledWith(CLIENTE_ID, {
      tipoIdentificacion: 'PASAPORTE',
      identificacion: 'CD456',
    });
  });
});
