import { Cliente } from '../../domain/cliente';
import type { ClientesRepositoryPort } from '../ports/clientes.repository.port';
import {
  ActualizarClienteUseCase,
  CrearClienteUseCase,
  CambiarActivoClienteUseCase,
} from './clientes.use-cases';

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
    activo: true,
    tienePolizas: false,
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

  it('con pólizas rechaza cambiar la identificación con 422 (D5)', async () => {
    const deps = crearDobles(
      crearCliente({
        tipoIdentificacion: 'PASAPORTE',
        identificacion: 'AB123',
        tienePolizas: true,
      }),
    );
    const caso = new ActualizarClienteUseCase(deps.clientes);

    await expect(caso.ejecutar(CLIENTE_ID, { identificacion: 'CD456' })).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'identificacion', motivo: 'IDENTIFICACION_CON_POLIZAS' },
    });
    expect(deps.clientes.actualizar).not.toHaveBeenCalled();
    expect(deps.clientes.existeIdentificacion).not.toHaveBeenCalled();
  });

  it('con pólizas acepta reenviar el mismo valor normalizado (D5)', async () => {
    const deps = crearDobles(
      crearCliente({
        tipoIdentificacion: 'PASAPORTE',
        identificacion: 'AB123',
        tienePolizas: true,
      }),
    );
    const caso = new ActualizarClienteUseCase(deps.clientes);

    await caso.ejecutar(CLIENTE_ID, { identificacion: ' ab123 ' });

    expect(deps.clientes.actualizar).toHaveBeenCalledWith(CLIENTE_ID, {
      tipoIdentificacion: 'PASAPORTE',
      identificacion: 'AB123',
    });
  });

  it('sin pólizas permite cambiar la identificación (D5)', async () => {
    const deps = crearDobles(
      crearCliente({ tipoIdentificacion: 'PASAPORTE', identificacion: 'AB123' }),
    );
    const caso = new ActualizarClienteUseCase(deps.clientes);

    await caso.ejecutar(CLIENTE_ID, { identificacion: 'CD456' });

    expect(deps.clientes.actualizar).toHaveBeenCalledWith(CLIENTE_ID, {
      tipoIdentificacion: 'PASAPORTE',
      identificacion: 'CD456',
    });
  });

  it('edita los datos de contacto de un cliente inactivo (D5)', async () => {
    const deps = crearDobles(crearCliente({ activo: false }));
    const caso = new ActualizarClienteUseCase(deps.clientes);

    await caso.ejecutar(CLIENTE_ID, { telefono: '0991234567' });

    expect(deps.clientes.actualizar).toHaveBeenCalledWith(CLIENTE_ID, {
      telefono: '0991234567',
    });
  });
});

describe('CambiarActivoClienteUseCase', () => {
  it('404 si el cliente no existe', async () => {
    const deps = crearDobles(null);
    const caso = new CambiarActivoClienteUseCase(deps.clientes);

    await expect(caso.ejecutar(CLIENTE_ID, false)).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
    expect(deps.clientes.actualizar).not.toHaveBeenCalled();
  });

  it.each([false, true])('es idempotente al dejar el cliente con activo=%s', async (activo) => {
    const cliente = crearCliente({ activo });
    const deps = crearDobles(cliente);
    const caso = new CambiarActivoClienteUseCase(deps.clientes);

    await expect(caso.ejecutar(CLIENTE_ID, activo)).resolves.toBe(cliente);
    expect(deps.clientes.actualizar).toHaveBeenCalledWith(CLIENTE_ID, { activo });
  });
});
