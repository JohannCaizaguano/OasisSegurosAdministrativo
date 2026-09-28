import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { createPublicClient, createWalletClient, getAddress, http, type PublicClient } from 'viem';
import { hardhat } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { registroRecibosAbi } from '@oasis/shared';

import { AppModule } from '../src/app.module';
import { AppConfig } from '../src/config/app.config';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { AnclarReciboUseCase } from '../src/modules/recibos/application/use-cases/anclar-recibo.use-case';
import {
  CONFIG_CADENA,
  type ConfiguracionCadenaPort,
} from '../src/modules/recibos/application/ports/configuracion-cadena.port';
import {
  RECIBOS_REPOSITORY,
  type RecibosRepositoryPort,
} from '../src/modules/recibos/application/ports/recibos.repository.port';
import { ViemRegistroRecibosAdapter } from '../src/modules/recibos/infrastructure/blockchain/viem-registro-recibos.adapter';
import type { Recibo } from '../src/modules/recibos/domain/recibo';
import type { ClockPort } from '../src/shared-kernel/clock.port';
import { TOKENS_TRANSVERSALES } from '../src/shared-kernel/tokens';

/**
 * Idempotencia del anclaje: se simula la caída del worker después de enviar la
 * transacción (antes de guardar el estado) y se verifica que al reanudar:
 *   - detecta el registro on-chain y marca ANCLADO sin enviar otra transacción
 *   - una segunda ejecución termina en SIN_CAMBIOS
 *   - la cadena contiene exactamente UN evento ReciboRegistrado para ese id
 *
 * El worker NO se levanta en este test: el job queda encolado pero sin procesar.
 */
describe('Idempotencia del anclaje (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let polizaId: string;
  let registro: ViemRegistroRecibosAdapter;
  let repositorio: RecibosRepositoryPort;
  let anclar: AnclarReciboUseCase;
  let cadena: ConfiguracionCadenaPort;
  let publicClientTest: PublicClient;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    prisma = app.get(PrismaService);
    const config = app.get(AppConfig);
    cadena = app.get(CONFIG_CADENA);
    repositorio = app.get(RECIBOS_REPOSITORY);

    const clave = process.env.OPERATOR_PRIVATE_KEY;
    if (!clave) {
      throw new Error('Falta OPERATOR_PRIVATE_KEY (ejecute pnpm dev:chain)');
    }

    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http(config.blockchain.rpcUrl),
    });
    publicClientTest = publicClient;
    const walletClient = createWalletClient({
      account: privateKeyToAccount(clave as `0x${string}`),
      chain: hardhat,
      transport: http(config.blockchain.rpcUrl),
    });

    registro = new ViemRegistroRecibosAdapter(publicClient, walletClient, cadena, hardhat);
    anclar = new AnclarReciboUseCase(
      repositorio,
      registro,
      cadena,
      app.get<ClockPort>(TOKENS_TRANSVERSALES.CLOCK),
    );

    const poliza = await prisma.poliza.findFirstOrThrow({ where: { estado: 'VIGENTE' } });
    polizaId = poliza.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'operador@oasis.com', password: 'Operador.Oasis1' })
      .expect(200);
    token = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  async function crearReciboPendiente(): Promise<Recibo> {
    const crear = await request(app.getHttpServer())
      .post('/api/v1/pagos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        polizaId,
        monto: '33.33',
        fechaPago: new Date().toISOString().slice(0, 10),
        metodo: 'EFECTIVO',
        referencia: `IDEM-${Date.now()}`,
      })
      .expect(201);

    const validar = await request(app.getHttpServer())
      .patch(`/api/v1/pagos/${crear.body.id}/validar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmado: true, nota: 'e2e' })
      .expect(200);

    const recibo = await repositorio.buscarPorId(validar.body.recibo.id);
    if (!recibo) {
      throw new Error('Recibo no encontrado tras validar el pago');
    }
    return recibo;
  }

  async function eventosDelRecibo(idOnchain: string): Promise<number> {
    const eventos = await publicClientTest.getContractEvents({
      address: getAddress(cadena.obtenerContractAddress()),
      abi: registroRecibosAbi,
      eventName: 'ReciboRegistrado',
      args: { idRecibo: idOnchain as `0x${string}` },
      fromBlock: 0n,
    });
    return eventos.length;
  }

  it('recupera un envío huérfano (caída tras broadcast) sin reenviar la transacción', async () => {
    const recibo = await crearReciboPendiente();

    // Caída simulada: la transacción se difunde pero el worker muere antes de
    // guardar txHash/estado en la base de datos.
    const { txHash } = await registro.enviarRegistro(recibo.idOnchain, recibo.hashRecibo, {
      maxFeePerGasGwei: cadena.maxFeePerGasGwei,
    });
    await new Promise((r) => setTimeout(r, 2_000));

    const primera = await anclar.ejecutar(recibo.id);
    expect(primera.estado).toBe('ANCLADO');

    const persistido = await repositorio.buscarPorId(recibo.id);
    expect(persistido?.estado).toBe('ANCLADO');

    const segunda = await anclar.ejecutar(recibo.id);
    expect(segunda.estado).toBe('SIN_CAMBIOS');

    expect(await eventosDelRecibo(recibo.idOnchain)).toBe(1);

    const enCadena = await registro.obtenerEnCadena(recibo.idOnchain);
    expect(enCadena.existe).toBe(true);
    expect(enCadena.hashRecibo.toLowerCase()).toBe(recibo.hashRecibo.toLowerCase());
    expect(txHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('recupera un recibo ENVIADO con txHash persistido y espera el receipt', async () => {
    const recibo = await crearReciboPendiente();

    const { txHash } = await registro.enviarRegistro(recibo.idOnchain, recibo.hashRecibo, {
      maxFeePerGasGwei: cadena.maxFeePerGasGwei,
    });

    // Caída simulada: txHash y estado ENVIADO quedaron persistidos.
    recibo.marcarEnviado(txHash, new Date());
    await repositorio.guardar(recibo);

    const salida = await anclar.ejecutar(recibo.id);
    expect(salida.estado).toBe('ANCLADO');

    const persistido = await repositorio.buscarPorId(recibo.id);
    expect(persistido?.estado).toBe('ANCLADO');
    expect(persistido?.txHash).toBe(txHash);
    expect(persistido?.blockNumber).toMatch(/^\d+$/);

    const repetida = await anclar.ejecutar(recibo.id);
    expect(repetida.estado).toBe('SIN_CAMBIOS');
    expect(await eventosDelRecibo(recibo.idOnchain)).toBe(1);
  });
});
