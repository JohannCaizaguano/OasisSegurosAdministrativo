import { Aseguradora } from '../../domain/aseguradora';
import type { AseguradorasRepositoryPort } from '../ports/aseguradoras.repository.port';
import { ActualizarAseguradoraUseCase, CrearAseguradoraUseCase } from './aseguradoras.use-cases';

const ASEGURADORA_ID = '44444444-4444-4444-4444-444444444444';

function crearAseguradora(parcial: Partial<Parameters<typeof Aseguradora.reconstituir>[0]> = {}) {
  return Aseguradora.reconstituir({
    id: ASEGURADORA_ID,
    nombre: 'Aseguradora del Pacífico C.A.',
    ruc: '1790012345001',
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...parcial,
  });
}

function crearDobles(aseguradora: Aseguradora | null = crearAseguradora()) {
  const aseguradoras: AseguradorasRepositoryPort = {
    crear: jest.fn().mockResolvedValue(aseguradora),
    listar: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(aseguradora),
    actualizar: jest.fn().mockResolvedValue(aseguradora),
    existeRuc: jest.fn().mockResolvedValue(false),
  };
  return { aseguradoras };
}

describe('CrearAseguradoraUseCase', () => {
  it('rechaza un RUC duplicado con 409 en el campo ruc', async () => {
    const deps = crearDobles();
    jest.mocked(deps.aseguradoras.existeRuc).mockResolvedValue(true);
    const caso = new CrearAseguradoraUseCase(deps.aseguradoras);

    await expect(
      caso.ejecutar({ nombre: 'Otra Aseguradora', ruc: '1790012345001' }),
    ).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      detalles: { campo: 'ruc', motivo: 'RUC_DUPLICADO' },
    });
    expect(deps.aseguradoras.crear).not.toHaveBeenCalled();
  });
});

describe('ActualizarAseguradoraUseCase', () => {
  it('al editar, permite conservar el mismo RUC', async () => {
    const deps = crearDobles();
    const caso = new ActualizarAseguradoraUseCase(deps.aseguradoras);

    await caso.ejecutar(ASEGURADORA_ID, { nombre: 'Nombre Nuevo', ruc: '1790012345001' });

    expect(deps.aseguradoras.existeRuc).not.toHaveBeenCalled();
    expect(deps.aseguradoras.actualizar).toHaveBeenCalledWith(ASEGURADORA_ID, {
      nombre: 'Nombre Nuevo',
      ruc: '1790012345001',
    });
  });
});
