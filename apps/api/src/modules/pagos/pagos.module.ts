import { Module } from '@nestjs/common';

import { TOKENS_TRANSVERSALES } from '../../shared-kernel/tokens';
import type { ClockPort } from '../../shared-kernel/clock.port';
import { COLA_ANCLAJE, type ColaAnclajePort } from '../recibos/application/ports/cola-anclaje.port';
import { EmitirReciboUseCase } from '../recibos/application/use-cases/emitir-recibo.use-case';
import { RecibosModule } from '../recibos/recibos.module';
import { PAGOS_REPOSITORY } from './application/ports/pagos.repository.port';
import {
  CrearPagoUseCase,
  ListarPagosUseCase,
  RechazarPagoUseCase,
} from './application/use-cases/pagos.use-cases';
import { ValidarPagoUseCase } from './application/use-cases/validar-pago.use-case';
import { PrismaPagosRepository } from './infrastructure/persistence/prisma-pagos.repository';
import { MisPagosController, PagosController } from './presentation/http/pagos.controller';

@Module({
  imports: [RecibosModule],
  controllers: [PagosController, MisPagosController],
  providers: [
    { provide: PAGOS_REPOSITORY, useClass: PrismaPagosRepository },
    {
      provide: CrearPagoUseCase,
      inject: [PAGOS_REPOSITORY],
      useFactory: (repo: PrismaPagosRepository) => new CrearPagoUseCase(repo),
    },
    {
      provide: ListarPagosUseCase,
      inject: [PAGOS_REPOSITORY],
      useFactory: (repo: PrismaPagosRepository) => new ListarPagosUseCase(repo),
    },
    {
      provide: RechazarPagoUseCase,
      inject: [PAGOS_REPOSITORY],
      useFactory: (repo: PrismaPagosRepository) => new RechazarPagoUseCase(repo),
    },
    {
      provide: ValidarPagoUseCase,
      inject: [PAGOS_REPOSITORY, EmitirReciboUseCase, COLA_ANCLAJE, TOKENS_TRANSVERSALES.CLOCK],
      useFactory: (
        repo: PrismaPagosRepository,
        emitir: EmitirReciboUseCase,
        cola: ColaAnclajePort,
        clock: ClockPort,
      ) => new ValidarPagoUseCase(repo, emitir, cola, clock),
    },
  ],
})
export class PagosModule {}
