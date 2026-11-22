import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { ColaAnclajePort } from '../ports/cola-anclaje.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';
import { AnclarReciboUseCase } from './anclar-recibo.use-case';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { RegistroRecibosPort } from '../ports/registro-recibos.port';
import { Recibo, type DatosNuevoRecibo } from '../../domain/recibo';
import { ReencolarPendientesUseCase } from './reencolar-pendientes.use-case';
import { ReintentarReciboUseCase } from './reintentar-recibo.use-case';

const RECIBO_ID = '11111111-1111-1111-1111-111111111111';
const HASH = `0x${'22'.repeat(32)}`;
const SAL = `0x${'33'.repeat(32)}`;

function datosNuevo(): DatosNuevoRecibo {
  return {
    id: RECIBO_ID,
    codigo: 'RC-ABC123',
    pagoId: '22222222-2222-2222-2222-222222222222',
    idOnchain: `0x${'11'.repeat(32)}`,
    hashRecibo: HASH,
    sal: SAL,
    payloadCanonico: '{"codigo":"RC-ABC123"}',
    chainId: 80002,
    contractAddress: '0x0000000000000000000000000000000000000009',
    creadoEn: '2026-09-01T12:00:00.000Z',
  };
}

class RecibosEnMemoria implements RecibosRepositoryPort {
  readonly guardados: Recibo[] = [];
  pendientes: Recibo[] = [];

  constructor(private readonly inicial: Recibo | null) {}

  async buscarPorId(id: string): Promise<Recibo | null> {
    return this.inicial && this.inicial.id === id ? this.inicial : null;
  }

  async buscarPorCodigo(codigo: string): Promise<Recibo | null> {
    return this.inicial && this.inicial.codigo === codigo ? this.inicial : null;
  }

  async listar(): Promise<{ items: Recibo[]; total: number }> {
    return { items: [], total: 0 };
  }

  async buscarImprimible(): Promise<null> {
    return null;
  }

  async guardar(recibo: Recibo): Promise<Recibo> {
    this.guardados.push(recibo);
    return recibo;
  }

  async listarPendientes(): Promise<Recibo[]> {
    return this.pendientes;
  }

  async contarPendientes(): Promise<number> {
    return this.pendientes.length;
  }
}

class ColaEspia implements ColaAnclajePort {
  readonly encolados: string[] = [];
  readonly desencolados: string[] = [];

  async encolarAnclaje(reciboId: string): Promise<void> {
    this.encolados.push(reciboId);
  }

  async encolarAnulacion(): Promise<void> {
    // sin uso en estos casos
  }

  async desencolarAnclaje(reciboId: string): Promise<void> {
    this.desencolados.push(reciboId);
  }
}

const reloj: ClockPort = { ahora: () => new Date('2026-09-01T12:00:30.000Z') };

const cadena: ConfiguracionCadenaPort = {
  chainId: 80002,
  maxFeePerGasGwei: 50,
  explorerBaseUrl: 'https://amoy.polygonscan.com',
  obtenerContractAddress: () => '0x0000000000000000000000000000000000000009',
  contractAddressSiExiste: () => '0x0000000000000000000000000000000000000009',
};

describe('Barrido del outbox (ReencolarPendientesUseCase)', () => {
  it('retira el job previo antes de reencolar, para vencer la deduplicación', async () => {
    const recibo = Recibo.nuevo(datosNuevo());
    const repo = new RecibosEnMemoria(recibo);
    repo.pendientes = [recibo];
    const cola = new ColaEspia();

    const resultado = await new ReencolarPendientesUseCase(repo, cola, reloj).ejecutar();

    expect(cola.desencolados).toEqual([RECIBO_ID]);
    expect(cola.encolados).toEqual([RECIBO_ID]);
    // El orden importa: quitar antes de encolar.
    expect(cola.desencolados.length).toBe(1);
    expect(resultado.reencolados).toBe(1);
  });

  it('cubre también los recibos ENVIADO devueltos por el repositorio', async () => {
    const enviado = Recibo.nuevo(datosNuevo());
    enviado.marcarEnviado(`0x${'44'.repeat(32)}`, new Date('2026-09-01T12:00:10.000Z'));
    const repo = new RecibosEnMemoria(enviado);
    repo.pendientes = [enviado];
    const cola = new ColaEspia();

    await new ReencolarPendientesUseCase(repo, cola, reloj).ejecutar();

    expect(cola.encolados).toEqual([RECIBO_ID]);
  });
});

describe('AnclarReciboUseCase (idempotencia)', () => {
  function registroStub(consulta: () => Promise<{ estado: string }>): RegistroRecibosPort {
    return {
      enviarRegistro: jest.fn(),
      consultarTransaccion: jest.fn(consulta) as never,
      obtenerEnCadena: jest.fn(async () => ({
        existe: false,
        hashRecibo: `0x${'00'.repeat(32)}`,
        registradoEn: 0n,
        anulado: false,
      })),
    } as unknown as RegistroRecibosPort;
  }

  it('no hace nada si el recibo ya está ANCLADO', async () => {
    const recibo = Recibo.nuevo(datosNuevo());
    recibo.marcarAnclado({ blockNumber: '1', gasUsed: '2', effectiveGasPrice: '3' }, new Date());
    const repo = new RecibosEnMemoria(recibo);
    const reg = registroStub(async () => ({ estado: 'confirmada' }));

    const salida = await new AnclarReciboUseCase(repo, reg, cadena, reloj).ejecutar(RECIBO_ID);

    expect(salida.estado).toBe('SIN_CAMBIOS');
    expect(repo.guardados).toHaveLength(0);
  });

  it('lanza NoEncontradoError si el recibo no existe', async () => {
    const repo = new RecibosEnMemoria(null);
    const reg = registroStub(async () => ({ estado: 'confirmada' }));

    await expect(
      new AnclarReciboUseCase(repo, reg, cadena, reloj).ejecutar(RECIBO_ID),
    ).rejects.toBeInstanceOf(NoEncontradoError);
  });
});

describe('Reintento de recibo', () => {
  it('exige el estado FALLIDO y limpia el último error', async () => {
    const recibo = Recibo.nuevo(datosNuevo());
    const repo = new RecibosEnMemoria(recibo);
    const cola = new ColaEspia();

    await expect(
      new ReintentarReciboUseCase(repo, cola).ejecutar(RECIBO_ID),
    ).rejects.toBeInstanceOf(ReglaNegocioError);

    recibo.marcarFallido('intentos agotados');
    const salida = await new ReintentarReciboUseCase(repo, cola).ejecutar(RECIBO_ID);

    expect(salida.estado).toBe('PENDIENTE_ANCLAJE');
    expect(salida.ultimoError).toBeNull();
    expect(cola.desencolados).toEqual([RECIBO_ID]);
    expect(cola.encolados).toEqual([RECIBO_ID]);
  });
});
