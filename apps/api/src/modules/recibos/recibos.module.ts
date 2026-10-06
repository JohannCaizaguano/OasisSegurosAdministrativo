import { Module, type Provider } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { COLA_ANCLAJE_RECIBOS } from '../../infrastructure/queue/queue.constants';
import { TOKENS_TRANSVERSALES } from '../../shared-kernel/tokens';
import type { ClockPort } from '../../shared-kernel/clock.port';
import { NodeCriptoAdapter } from './infrastructure/crypto/node-cripto.adapter';
import { ConfiguracionCadenaAdapter } from './infrastructure/blockchain/configuracion-cadena.adapter';
import { ViemRegistroRecibosAdapter } from './infrastructure/blockchain/viem-registro-recibos.adapter';
import { PrismaRecibosRepository } from './infrastructure/persistence/prisma-recibos.repository';
import { BullMqColaAnclajeAdapter } from './infrastructure/queue/bullmq-cola-anclaje.adapter';
import { RecibosController } from './presentation/http/recibos.controller';
import { COLA_ANCLAJE } from './application/ports/cola-anclaje.port';
import { CONFIG_CADENA } from './application/ports/configuracion-cadena.port';
import { CRIPTO } from './application/ports/cripto.port';
import { HASHER_RECIBOS } from './application/ports/hasher-recibos.port';
import { RECIBOS_REPOSITORY } from './application/ports/recibos.repository.port';
import { REGISTRO_RECIBOS } from './application/ports/registro-recibos.port';
import { ViemHasherRecibosAdapter } from './infrastructure/blockchain/viem-hasher-recibos.adapter';
import { AnclarReciboUseCase } from './application/use-cases/anclar-recibo.use-case';
import { AnularReciboEnCadenaUseCase } from './application/use-cases/anular-recibo-en-cadena.use-case';
import { AnularReciboUseCase } from './application/use-cases/anular-recibo.use-case';
import { EmitirReciboUseCase } from './application/use-cases/emitir-recibo.use-case';
import { ObtenerReciboUseCase } from './application/use-cases/obtener-recibo.use-case';
import { ReencolarPendientesUseCase } from './application/use-cases/reencolar-pendientes.use-case';
import { ReintentarReciboUseCase } from './application/use-cases/reintentar-recibo.use-case';
import { VerificarReciboUseCase } from './application/use-cases/verificar-recibo.use-case';

const casosDeUso: Provider[] = [
  {
    provide: EmitirReciboUseCase,
    inject: [CRIPTO, HASHER_RECIBOS, CONFIG_CADENA, TOKENS_TRANSVERSALES.CLOCK],
    useFactory: (
      cripto: NodeCriptoAdapter,
      hasher: ViemHasherRecibosAdapter,
      cadena: ConfiguracionCadenaAdapter,
      clock: ClockPort,
    ) => new EmitirReciboUseCase(cripto, hasher, cadena, clock),
  },
  {
    provide: ObtenerReciboUseCase,
    inject: [RECIBOS_REPOSITORY],
    useFactory: (repo: PrismaRecibosRepository) => new ObtenerReciboUseCase(repo),
  },
  {
    provide: VerificarReciboUseCase,
    inject: [
      RECIBOS_REPOSITORY,
      REGISTRO_RECIBOS,
      HASHER_RECIBOS,
      CONFIG_CADENA,
      TOKENS_TRANSVERSALES.CLOCK,
    ],
    useFactory: (
      repo: PrismaRecibosRepository,
      registro: ViemRegistroRecibosAdapter,
      hasher: ViemHasherRecibosAdapter,
      cadena: ConfiguracionCadenaAdapter,
      clock: ClockPort,
    ) => new VerificarReciboUseCase(repo, registro, hasher, cadena, clock),
  },
  {
    provide: AnularReciboUseCase,
    inject: [RECIBOS_REPOSITORY, COLA_ANCLAJE],
    useFactory: (repo: PrismaRecibosRepository, cola: BullMqColaAnclajeAdapter) =>
      new AnularReciboUseCase(repo, cola),
  },
  {
    provide: ReintentarReciboUseCase,
    inject: [RECIBOS_REPOSITORY, COLA_ANCLAJE],
    useFactory: (repo: PrismaRecibosRepository, cola: BullMqColaAnclajeAdapter) =>
      new ReintentarReciboUseCase(repo, cola),
  },
  {
    provide: AnclarReciboUseCase,
    inject: [RECIBOS_REPOSITORY, REGISTRO_RECIBOS, CONFIG_CADENA, TOKENS_TRANSVERSALES.CLOCK],
    useFactory: (
      repo: PrismaRecibosRepository,
      registro: ViemRegistroRecibosAdapter,
      cadena: ConfiguracionCadenaAdapter,
      clock: ClockPort,
    ) => new AnclarReciboUseCase(repo, registro, cadena, clock),
  },
  {
    provide: ReencolarPendientesUseCase,
    inject: [RECIBOS_REPOSITORY, COLA_ANCLAJE, TOKENS_TRANSVERSALES.CLOCK],
    useFactory: (repo: PrismaRecibosRepository, cola: BullMqColaAnclajeAdapter, clock: ClockPort) =>
      new ReencolarPendientesUseCase(repo, cola, clock),
  },
  {
    provide: AnularReciboEnCadenaUseCase,
    inject: [RECIBOS_REPOSITORY, REGISTRO_RECIBOS, HASHER_RECIBOS, CONFIG_CADENA],
    useFactory: (
      repo: PrismaRecibosRepository,
      registro: ViemRegistroRecibosAdapter,
      hasher: ViemHasherRecibosAdapter,
      cadena: ConfiguracionCadenaAdapter,
    ) => new AnularReciboEnCadenaUseCase(repo, registro, hasher, cadena),
  },
];

@Module({
  imports: [BullModule.registerQueue({ name: COLA_ANCLAJE_RECIBOS })],
  controllers: [RecibosController],
  providers: [
    { provide: CRIPTO, useClass: NodeCriptoAdapter },
    { provide: HASHER_RECIBOS, useClass: ViemHasherRecibosAdapter },
    { provide: CONFIG_CADENA, useClass: ConfiguracionCadenaAdapter },
    { provide: RECIBOS_REPOSITORY, useClass: PrismaRecibosRepository },
    { provide: REGISTRO_RECIBOS, useClass: ViemRegistroRecibosAdapter },
    { provide: COLA_ANCLAJE, useClass: BullMqColaAnclajeAdapter },
    ...casosDeUso,
  ],
  exports: [
    RECIBOS_REPOSITORY,
    REGISTRO_RECIBOS,
    COLA_ANCLAJE,
    CONFIG_CADENA,
    EmitirReciboUseCase,
    AnclarReciboUseCase,
    ReencolarPendientesUseCase,
    AnularReciboEnCadenaUseCase,
    VerificarReciboUseCase,
  ],
})
export class RecibosModule {}
