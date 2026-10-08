import { Poliza } from '../../domain/poliza';
import type { PolizasRepositoryPort } from '../ports/polizas.repository.port';
import {
  ActualizarPolizaUseCase,
  CambiarEstadoPolizaUseCase,
  CrearPolizaUseCase,
} from './polizas.use-cases';

const POLIZA_ID = '11111111-1111-1111-1111-111111111111';
const CLIENTE_ID = '22222222-2222-2222-2222-222222222222';
const ASEGURADORA_ID = '33333333-3333-3333-3333-333333333333';
const RAMO_ID = '44444444-4444-4444-4444-444444444444';

const DATOS_CREAR = {
  numero: 'POL-001',
  clienteId: CLIENTE_ID,
  aseguradoraId: ASEGURADORA_ID,
  ramoId: RAMO_ID,
  primaTotal: '1500.50',
  fechaInicio: '2026-01-01',
  fechaFin: '2026-12-31',
};

function crearPoliza(parcial: Partial<Parameters<typeof Poliza.reconstituir>[0]> = {}) {
  return Poliza.reconstituir({
    id: POLIZA_ID,
    numero: 'POL-001',
    clienteId: CLIENTE_ID,
    aseguradoraId: ASEGURADORA_ID,
    ramoId: RAMO_ID,
    ramo: 'Vida',
    primaTotal: '1500.5',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-12-31',
    estado: 'VIGENTE',
    tienePagosValidados: false,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...parcial,
  });
}

function crearDobles(poliza: Poliza | null = crearPoliza()) {
  const polizas: PolizasRepositoryPort = {
    crear: jest.fn().mockResolvedValue(poliza),
    listar: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(poliza),
    actualizar: jest.fn().mockResolvedValue(poliza),
    existeNumero: jest.fn().mockResolvedValue(false),
    buscarClienteParaPoliza: jest.fn().mockResolvedValue({ activo: true }),
    existeAseguradora: jest.fn().mockResolvedValue(true),
    buscarRamoActivoPorId: jest.fn().mockResolvedValue({
      id: RAMO_ID,
      codigo: 'VIDA',
      nombre: 'Vida',
    }),
    cambiarEstado: jest.fn().mockResolvedValue(poliza),
    listarRamosActivos: jest.fn().mockResolvedValue([]),
  };
  return { polizas };
}

describe('CrearPolizaUseCase', () => {
  it('404 si el cliente no existe y no sigue validando', async () => {
    const deps = crearDobles();
    jest.mocked(deps.polizas.buscarClienteParaPoliza).mockResolvedValue(null);
    const caso = new CrearPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(DATOS_CREAR)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
    expect(deps.polizas.existeAseguradora).not.toHaveBeenCalled();
    expect(deps.polizas.crear).not.toHaveBeenCalled();
  });

  it('422 CLIENTE_INACTIVO si el cliente está inactivo, antes que la aseguradora (D9)', async () => {
    const deps = crearDobles();
    jest.mocked(deps.polizas.buscarClienteParaPoliza).mockResolvedValue({ activo: false });
    const caso = new CrearPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(DATOS_CREAR)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'clienteId', motivo: 'CLIENTE_INACTIVO' },
    });
    expect(deps.polizas.existeAseguradora).not.toHaveBeenCalled();
  });

  it('404 si la aseguradora no existe, antes que el ramo (D9)', async () => {
    const deps = crearDobles();
    jest.mocked(deps.polizas.existeAseguradora).mockResolvedValue(false);
    const caso = new CrearPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(DATOS_CREAR)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
    expect(deps.polizas.buscarRamoActivoPorId).not.toHaveBeenCalled();
    expect(deps.polizas.crear).not.toHaveBeenCalled();
  });

  it('422 RAMO_INVALIDO si el ramo no está activo, antes que el número (D9)', async () => {
    const deps = crearDobles();
    jest.mocked(deps.polizas.buscarRamoActivoPorId).mockResolvedValue(null);
    const caso = new CrearPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(DATOS_CREAR)).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'ramoId', motivo: 'RAMO_INVALIDO' },
    });
    expect(deps.polizas.existeNumero).not.toHaveBeenCalled();
  });

  it('409 NUMERO_DUPLICADO si el número ya existe (D9)', async () => {
    const deps = crearDobles();
    jest.mocked(deps.polizas.existeNumero).mockResolvedValue(true);
    const caso = new CrearPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(DATOS_CREAR)).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'numero', motivo: 'NUMERO_DUPLICADO' },
    });
    expect(deps.polizas.crear).not.toHaveBeenCalled();
  });

  it('crea la póliza con los datos validados, sin estado (nace VIGENTE)', async () => {
    const deps = crearDobles();
    const caso = new CrearPolizaUseCase(deps.polizas);

    await caso.ejecutar(DATOS_CREAR);

    expect(deps.polizas.crear).toHaveBeenCalledWith(DATOS_CREAR);
  });
});

describe('ActualizarPolizaUseCase', () => {
  it('404 si la póliza no existe', async () => {
    const deps = crearDobles(null);
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(POLIZA_ID, { numero: 'POL-002' })).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
    expect(deps.polizas.actualizar).not.toHaveBeenCalled();
  });

  it('422 POLIZA_NO_VIGENTE si la póliza no está vigente (D11)', async () => {
    const deps = crearDobles(crearPoliza({ estado: 'VENCIDA' }));
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(POLIZA_ID, { numero: 'POL-002' })).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'estado', motivo: 'POLIZA_NO_VIGENTE' },
    });
    expect(deps.polizas.actualizar).not.toHaveBeenCalled();
  });

  it('422 PRIMA_CON_PAGOS_VALIDADOS si cambia la prima con pagos validados (D11)', async () => {
    const deps = crearDobles(crearPoliza({ tienePagosValidados: true }));
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(POLIZA_ID, { primaTotal: '2000.00' })).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'primaTotal', motivo: 'PRIMA_CON_PAGOS_VALIDADOS' },
    });
    expect(deps.polizas.actualizar).not.toHaveBeenCalled();
  });

  it('acepta la misma prima con pagos validados (D11)', async () => {
    const deps = crearDobles(crearPoliza({ tienePagosValidados: true }));
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await caso.ejecutar(POLIZA_ID, { primaTotal: '1500.50' });

    expect(deps.polizas.actualizar).toHaveBeenCalledWith(POLIZA_ID, {});
  });

  it('no revalida el ramo ni la aseguradora si no cambian (catálogo con retiros)', async () => {
    const poliza = crearPoliza();
    const deps = crearDobles(poliza);
    jest.mocked(deps.polizas.buscarRamoActivoPorId).mockResolvedValue(null);
    jest.mocked(deps.polizas.existeAseguradora).mockResolvedValue(false);
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await caso.ejecutar(POLIZA_ID, {
      ramoId: poliza.ramoId,
      aseguradoraId: poliza.aseguradoraId,
      fechaFin: '2027-06-30',
    });

    expect(deps.polizas.actualizar).toHaveBeenCalled();
  });

  it('422 VALIDACION si la fecha final resultante no es posterior a la inicial (D11)', async () => {
    const deps = crearDobles();
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(POLIZA_ID, { fechaFin: '2025-12-31' })).rejects.toMatchObject({
      codigo: 'VALIDACION',
      detalles: [{ path: ['fechaFin'] }],
    });
    expect(deps.polizas.actualizar).not.toHaveBeenCalled();
  });

  it('409 NUMERO_DUPLICADO si el número nuevo ya existe (D11)', async () => {
    const deps = crearDobles();
    jest.mocked(deps.polizas.existeNumero).mockResolvedValue(true);
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(POLIZA_ID, { numero: 'POL-002' })).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'numero', motivo: 'NUMERO_DUPLICADO' },
    });
    expect(deps.polizas.existeNumero).toHaveBeenCalledWith('POL-002', POLIZA_ID);
    expect(deps.polizas.actualizar).not.toHaveBeenCalled();
  });

  it('404 si la aseguradora nueva no existe, antes de escribir (D11)', async () => {
    const deps = crearDobles();
    jest.mocked(deps.polizas.existeAseguradora).mockResolvedValue(false);
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await expect(
      caso.ejecutar(POLIZA_ID, { aseguradoraId: '66666666-6666-6666-6666-666666666666' }),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
    expect(deps.polizas.actualizar).not.toHaveBeenCalled();
  });

  it('422 RAMO_INVALIDO si el ramo no está activo (D11)', async () => {
    const deps = crearDobles();
    jest.mocked(deps.polizas.buscarRamoActivoPorId).mockResolvedValue(null);
    const caso = new ActualizarPolizaUseCase(deps.polizas);

    await expect(
      caso.ejecutar(POLIZA_ID, { ramoId: '55555555-5555-5555-5555-555555555555' }),
    ).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'ramoId', motivo: 'RAMO_INVALIDO' },
    });
    expect(deps.polizas.actualizar).not.toHaveBeenCalled();
  });
});

describe('CambiarEstadoPolizaUseCase', () => {
  it('404 si la póliza no existe', async () => {
    const deps = crearDobles(null);
    const caso = new CambiarEstadoPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(POLIZA_ID, 'CANCELADA')).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
    expect(deps.polizas.cambiarEstado).not.toHaveBeenCalled();
  });

  it('422 POLIZA_NO_VIGENTE si la póliza ya no está vigente (D12)', async () => {
    const deps = crearDobles(crearPoliza({ estado: 'CANCELADA' }));
    const caso = new CambiarEstadoPolizaUseCase(deps.polizas);

    await expect(caso.ejecutar(POLIZA_ID, 'VENCIDA')).rejects.toMatchObject({
      codigo: 'REGLA_NEGOCIO',
      detalles: { campo: 'estado', motivo: 'POLIZA_NO_VIGENTE' },
    });
    expect(deps.polizas.cambiarEstado).not.toHaveBeenCalled();
  });

  it('cambia a CANCELADA solo desde VIGENTE (D12)', async () => {
    const deps = crearDobles();
    const caso = new CambiarEstadoPolizaUseCase(deps.polizas);

    await caso.ejecutar(POLIZA_ID, 'CANCELADA');

    expect(deps.polizas.cambiarEstado).toHaveBeenCalledWith(POLIZA_ID, 'CANCELADA');
  });
});
