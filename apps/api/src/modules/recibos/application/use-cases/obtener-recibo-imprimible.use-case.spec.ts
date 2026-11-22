import { reciboImprimibleSchema } from '@oasis/shared';

import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type {
  DatosReciboImprimible,
  RecibosRepositoryPort,
} from '../ports/recibos.repository.port';
import { ObtenerReciboImprimibleUseCase } from './obtener-recibo-imprimible.use-case';

const RECIBO_ID = '11111111-1111-1111-1111-111111111111';
const CLIENTE_ID = '44444444-4444-4444-4444-444444444444';
const TX = `0x${'aa'.repeat(32)}`;

const DATOS: DatosReciboImprimible = {
  codigo: 'RC-ABC123ABC123',
  estado: 'ANCLADO',
  creadoEn: '2026-09-01T12:00:00.000Z',
  ancladoEn: '2026-09-01T12:00:20.000Z',
  txHash: TX,
  pago: { monto: '120.13', fechaPago: '2026-09-01', metodo: 'TRANSFERENCIA', referencia: 'TRF-1' },
  poliza: {
    numero: 'POL-2026-0001',
    ramo: 'Vehículos',
    aseguradora: 'Aseguradora del Pacífico C.A.',
    clienteId: CLIENTE_ID,
  },
  cliente: { nombre: 'María Fernanda Cabrera Rosero', identificacion: '1710034065' },
};

const cadena: ConfiguracionCadenaPort = {
  chainId: 80002,
  maxFeePerGasGwei: 50,
  explorerBaseUrl: 'https://amoy.polygonscan.com',
  obtenerContractAddress: () => '0x0000000000000000000000000000000000000009',
  contractAddressSiExiste: () => '0x0000000000000000000000000000000000000009',
};

function crear(datos: DatosReciboImprimible | null = DATOS) {
  const recibos = {
    buscarImprimible: jest.fn().mockResolvedValue(datos),
  } as unknown as RecibosRepositoryPort;
  return new ObtenerReciboImprimibleUseCase(recibos, cadena);
}

function claves(valor: unknown): string[] {
  if (valor === null || typeof valor !== 'object') return [];
  return Object.entries(valor).flatMap(([clave, hijo]) => [clave, ...claves(hijo)]);
}

describe('ObtenerReciboImprimibleUseCase (HU-25, D7)', () => {
  it('devuelve el recibo imprimible con la forma estricta del contrato compartido', async () => {
    const imprimible = await crear().ejecutar(RECIBO_ID);

    expect(reciboImprimibleSchema.parse(imprimible)).toEqual(imprimible);
    expect(imprimible).toMatchObject({
      codigo: 'RC-ABC123ABC123',
      estadoAnclaje: 'ANCLADO',
      emitidoEn: '2026-09-01T12:00:00.000Z',
      explorerUrl: `https://amoy.polygonscan.com/tx/${TX}`,
      poliza: { numero: 'POL-2026-0001', ramo: 'Vehículos' },
    });
  });

  it('enmascara la identificación dejando visibles los 4 últimos caracteres', async () => {
    const imprimible = await crear().ejecutar(RECIBO_ID);

    expect(imprimible.cliente.identificacionEnmascarada).toBe('******4065');
  });

  it('no contiene sal, payload canónico, idOnchain, intentos ni último error en ningún nivel', async () => {
    const todas = claves(await crear().ejecutar(RECIBO_ID));

    for (const prohibida of ['sal', 'payloadCanonico', 'idOnchain', 'intentos', 'ultimoError']) {
      expect(todas).not.toContain(prohibida);
    }
    expect(todas).not.toContain('clienteId');
    expect(todas).not.toContain('identificacion');
  });

  it('sin transacción no hay enlace al explorador', async () => {
    const imprimible = await crear({
      ...DATOS,
      txHash: null,
      estado: 'PENDIENTE_ANCLAJE',
    }).ejecutar(RECIBO_ID);

    expect(imprimible.explorerUrl).toBeNull();
  });

  it('404 si el recibo no existe', async () => {
    await expect(crear(null).ejecutar(RECIBO_ID)).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });

  it('el CLIENTE obtiene su propio recibo', async () => {
    await expect(crear().ejecutar(RECIBO_ID, { clienteId: CLIENTE_ID })).resolves.toMatchObject({
      codigo: 'RC-ABC123ABC123',
    });
  });

  it('404 para el CLIENTE si el recibo es de otro cliente o no tiene cliente asociado (RN-07)', async () => {
    const otro = '55555555-5555-5555-5555-555555555555';

    await expect(crear().ejecutar(RECIBO_ID, { clienteId: otro })).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
    await expect(crear().ejecutar(RECIBO_ID, { clienteId: null })).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});
