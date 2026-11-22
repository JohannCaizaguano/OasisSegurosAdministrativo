import type { ClockPort } from '../../../../shared-kernel/clock.port';
import { HashRecibo } from '../../domain/hash-recibo';
import { Recibo, type PropsRecibo } from '../../domain/recibo';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { HasherRecibosPort } from '../ports/hasher-recibos.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';
import type { EstadoEnCadena, RegistroRecibosPort } from '../ports/registro-recibos.port';
import { type ResultadoVerificacion, VerificarReciboUseCase } from './verificar-recibo.use-case';

const HASH = `0x${'22'.repeat(32)}`;
const SAL = `0x${'33'.repeat(32)}`;
const CLIENTE_DUENO = '44444444-4444-4444-4444-444444444444';
const OTRO_CLIENTE = '55555555-5555-5555-5555-555555555555';
const TX = `0x${'aa'.repeat(32)}`;

function recibo(cambios: Partial<PropsRecibo> = {}): Recibo {
  return Recibo.reconstituir({
    id: '11111111-1111-1111-1111-111111111111',
    codigo: 'RC-ABC123ABC123',
    pagoId: '22222222-2222-2222-2222-222222222222',
    idOnchain: `0x${'11'.repeat(32)}`,
    hashRecibo: HASH,
    sal: SAL,
    payloadCanonico: '{"codigo":"RC-ABC123ABC123"}',
    chainId: 80002,
    contractAddress: '0x0000000000000000000000000000000000000009',
    creadoEn: '2026-09-01T12:00:00.000Z',
    estado: 'ANCLADO',
    txHash: TX,
    blockNumber: '10',
    gasUsed: '1',
    effectiveGasPrice: '1',
    intentos: 1,
    ultimoError: null,
    enviadoEn: '2026-09-01T12:00:10.000Z',
    ancladoEn: '2026-09-01T12:00:20.000Z',
    numeroPoliza: 'POL-1',
    clienteId: CLIENTE_DUENO,
    ...cambios,
  });
}

const reloj: ClockPort = { ahora: () => new Date('2026-09-01T12:00:30.000Z') };

const cadena: ConfiguracionCadenaPort = {
  chainId: 80002,
  maxFeePerGasGwei: 50,
  explorerBaseUrl: 'https://amoy.polygonscan.com',
  obtenerContractAddress: () => '0x0000000000000000000000000000000000000009',
  contractAddressSiExiste: () => '0x0000000000000000000000000000000000000009',
};

const hasher: HasherRecibosPort = {
  hashRecibo: () => HashRecibo.de(HASH, SAL),
  hashTexto: () => `0x${'11'.repeat(32)}`,
};

const REGISTRADO: EstadoEnCadena = {
  existe: true,
  hashRecibo: HASH,
  registradoEn: 1,
  anulado: false,
};

function crear(encontrado: Recibo | null, enCadena: EstadoEnCadena | Error = REGISTRADO) {
  const recibos = {
    buscarPorCodigo: jest.fn(async (codigo: string) =>
      encontrado && encontrado.codigo === codigo ? encontrado : null,
    ),
  } as unknown as RecibosRepositoryPort;
  const obtenerEnCadena = jest.fn(async () => {
    if (enCadena instanceof Error) throw enCadena;
    return enCadena;
  });
  const registro = { obtenerEnCadena } as unknown as RegistroRecibosPort;
  const caso = new VerificarReciboUseCase(recibos, registro, hasher, cadena, reloj);
  return { caso, obtenerEnCadena };
}

describe('VerificarReciboUseCase: los cinco resultados (D2)', () => {
  it('AUTENTICO cuando el hash recalculado coincide con el registrado y no está anulado', async () => {
    const { caso } = crear(recibo());

    const salida = await caso.ejecutar('RC-ABC123ABC123');

    expect(salida.estado).toBe('AUTENTICO');
    expect(salida.explorerUrl).toBe(`https://amoy.polygonscan.com/tx/${TX}`);
    expect(salida.hashOnchain).toBe(HASH);
    expect(salida.contractAddress).toBe('0x0000000000000000000000000000000000000009');
  });

  it('NO_COINCIDE cuando el hash en la cadena es distinto del recalculado', async () => {
    const { caso } = crear(recibo(), { ...REGISTRADO, hashRecibo: `0x${'99'.repeat(32)}` });

    expect((await caso.ejecutar('RC-ABC123ABC123')).estado).toBe('NO_COINCIDE');
  });

  it.each(['PENDIENTE_ANCLAJE', 'ENVIADO', 'FALLIDO'] as const)(
    'EN_PROCESO cuando el recibo %s aún no está registrado en el contrato',
    async (estado) => {
      const { caso } = crear(recibo({ estado, txHash: null }), { ...REGISTRADO, existe: false });

      const salida = await caso.ejecutar('RC-ABC123ABC123');

      expect(salida.estado).toBe('EN_PROCESO');
      expect(salida.hashOnchain).toBeNull();
    },
  );

  it('ANULADO cuando el contrato lo marca anulado', async () => {
    const { caso } = crear(recibo(), { ...REGISTRADO, anulado: true });

    expect((await caso.ejecutar('RC-ABC123ABC123')).estado).toBe('ANULADO');
  });

  it('ANULADO cuando la base lo anuló aunque siga registrado y sin anular en la cadena', async () => {
    const { caso } = crear(recibo({ estado: 'ANULADO' }));

    expect((await caso.ejecutar('RC-ABC123ABC123')).estado).toBe('ANULADO');
  });

  it('ANULADO gana a un hash distinto y a la falta de registro (orden de D2)', async () => {
    const anulado = recibo({ estado: 'ANULADO' });

    const sinRegistro = crear(anulado, { ...REGISTRADO, existe: false });
    const otroHash = crear(anulado, { ...REGISTRADO, hashRecibo: `0x${'99'.repeat(32)}` });

    expect((await sinRegistro.caso.ejecutar('RC-ABC123ABC123')).estado).toBe('ANULADO');
    expect((await otroHash.caso.ejecutar('RC-ABC123ABC123')).estado).toBe('ANULADO');
    expect(sinRegistro.obtenerEnCadena).not.toHaveBeenCalled();
    expect(otroHash.obtenerEnCadena).not.toHaveBeenCalled();
  });

  it('ANULADO en la base no consulta la cadena aunque el RPC esté caído (Q17)', async () => {
    const { caso, obtenerEnCadena } = crear(
      recibo({ estado: 'ANULADO' }),
      new Error('fetch failed'),
    );

    const salida = await caso.ejecutar('RC-ABC123ABC123');

    expect(salida.estado).toBe('ANULADO');
    expect(obtenerEnCadena).not.toHaveBeenCalled();
  });

  it('NO_ENCONTRADO sin consultar la cadena cuando el código no existe', async () => {
    const { caso, obtenerEnCadena } = crear(null);

    const salida = await caso.ejecutar('RC-000000000000');

    expect(salida.estado).toBe('NO_ENCONTRADO');
    expect(obtenerEnCadena).not.toHaveBeenCalled();
  });

  it('con el RPC caído lanza un error de dependencia externa (502), no un resultado falso', async () => {
    const { caso } = crear(recibo(), new Error('fetch failed'));

    await expect(caso.ejecutar('RC-ABC123ABC123')).rejects.toMatchObject({
      codigo: 'DEPENDENCIA_EXTERNA',
    });
  });

  it('no expone la sal ni el payload canónico', async () => {
    const { caso } = crear(recibo());

    const salida = await caso.ejecutar('RC-ABC123ABC123');

    expect(salida).not.toHaveProperty('sal');
    expect(salida).not.toHaveProperty('payloadCanonico');
  });
});

describe('VerificarReciboUseCase: el CLIENTE solo verifica sus recibos (D3, RN-07)', () => {
  const sinVariables = ({ codigo: _c, verificadoEn: _v, ...resto }: ResultadoVerificacion) => resto;

  it('verifica su propio recibo sin hashOnchain ni contractAddress y con explorerUrl', async () => {
    const { caso } = crear(recibo());

    const salida = await caso.ejecutar('RC-ABC123ABC123', { clienteId: CLIENTE_DUENO });

    expect(salida.estado).toBe('AUTENTICO');
    expect(salida).not.toHaveProperty('hashOnchain');
    expect(salida).not.toHaveProperty('contractAddress');
    expect(salida.explorerUrl).toBe(`https://amoy.polygonscan.com/tx/${TX}`);
  });

  it('un recibo ajeno responde igual que uno inexistente y no consulta la cadena', async () => {
    const ajeno = crear(recibo());
    const inexistente = crear(null);

    const deAjeno = await ajeno.caso.ejecutar('RC-ABC123ABC123', { clienteId: OTRO_CLIENTE });
    const deInexistente = await inexistente.caso.ejecutar('RC-000000000000', {
      clienteId: OTRO_CLIENTE,
    });

    expect(deAjeno.estado).toBe('NO_ENCONTRADO');
    expect(sinVariables(deAjeno)).toEqual(sinVariables(deInexistente));
    expect(ajeno.obtenerEnCadena).not.toHaveBeenCalled();
  });

  it('un recibo ANULADO propio responde ANULADO sin consultar la cadena y con la máscara (Q17)', async () => {
    const { caso, obtenerEnCadena } = crear(
      recibo({ estado: 'ANULADO' }),
      new Error('fetch failed'),
    );

    const salida = await caso.ejecutar('RC-ABC123ABC123', { clienteId: CLIENTE_DUENO });

    expect(salida.estado).toBe('ANULADO');
    expect(salida).not.toHaveProperty('hashOnchain');
    expect(salida).not.toHaveProperty('contractAddress');
    expect(obtenerEnCadena).not.toHaveBeenCalled();
  });

  it('un CLIENTE sin cliente asociado recibe NO_ENCONTRADO', async () => {
    const { caso, obtenerEnCadena } = crear(recibo());

    const salida = await caso.ejecutar('RC-ABC123ABC123', { clienteId: null });

    expect(salida.estado).toBe('NO_ENCONTRADO');
    expect(obtenerEnCadena).not.toHaveBeenCalled();
  });
});
