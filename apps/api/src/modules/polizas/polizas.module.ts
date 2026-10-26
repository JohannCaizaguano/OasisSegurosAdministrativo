import { Module } from '@nestjs/common';

import { TOKENS_TRANSVERSALES } from '../../shared-kernel/tokens';
import type { ClockPort } from '../../shared-kernel/clock.port';
import { ListarCarteraUseCase } from './application/use-cases/listar-cartera.use-case';

import { POLIZAS_REPOSITORY } from './application/ports/polizas.repository.port';
import {
  ActualizarPolizaUseCase,
  CambiarEstadoPolizaUseCase,
  CrearPolizaUseCase,
  ListarPolizasDeClienteUseCase,
  ListarPolizasUseCase,
  ListarRamosUseCase,
  ObtenerPolizaUseCase,
} from './application/use-cases/polizas.use-cases';
import { PrismaPolizasRepository } from './infrastructure/persistence/prisma-polizas.repository';
import { MisPolizasController, PolizasController } from './presentation/http/polizas.controller';
import { RamosController } from './presentation/http/ramos.controller';
import { CarteraController, CuotasController } from './presentation/http/cuotas.controller';
import {
  DefinirPlanCuotasUseCase,
  ObtenerPlanCuotasUseCase,
} from './application/use-cases/cuotas.use-cases';

@Module({
  controllers: [
    PolizasController,
    MisPolizasController,
    RamosController,
    CuotasController,
    CarteraController,
  ],
  providers: [
    { provide: POLIZAS_REPOSITORY, useClass: PrismaPolizasRepository },
    {
      provide: CrearPolizaUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new CrearPolizaUseCase(repo),
    },
    {
      provide: ListarPolizasUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new ListarPolizasUseCase(repo),
    },
    {
      provide: ListarPolizasDeClienteUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new ListarPolizasDeClienteUseCase(repo),
    },
    {
      provide: ObtenerPolizaUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new ObtenerPolizaUseCase(repo),
    },
    {
      provide: ActualizarPolizaUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new ActualizarPolizaUseCase(repo),
    },
    {
      provide: CambiarEstadoPolizaUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new CambiarEstadoPolizaUseCase(repo),
    },
    {
      provide: ListarRamosUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new ListarRamosUseCase(repo),
    },
    {
      provide: ObtenerPlanCuotasUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new ObtenerPlanCuotasUseCase(repo),
    },
    {
      provide: DefinirPlanCuotasUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new DefinirPlanCuotasUseCase(repo),
    },
    {
      provide: ListarCarteraUseCase,
      inject: [POLIZAS_REPOSITORY, TOKENS_TRANSVERSALES.CLOCK],
      useFactory: (repo: PrismaPolizasRepository, clock: ClockPort) =>
        new ListarCarteraUseCase(repo, clock),
    },
  ],
  exports: [POLIZAS_REPOSITORY],
})
export class PolizasModule {}
