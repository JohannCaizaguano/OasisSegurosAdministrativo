import { Module } from '@nestjs/common';

import { POLIZAS_REPOSITORY } from './application/ports/polizas.repository.port';
import {
  ActualizarPolizaUseCase,
  CrearPolizaUseCase,
  EliminarPolizaUseCase,
  ListarPolizasDeClienteUseCase,
  ListarPolizasUseCase,
  ObtenerPolizaUseCase,
} from './application/use-cases/polizas.use-cases';
import { PrismaPolizasRepository } from './infrastructure/persistence/prisma-polizas.repository';
import { MisPolizasController, PolizasController } from './presentation/http/polizas.controller';

@Module({
  controllers: [PolizasController, MisPolizasController],
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
      provide: EliminarPolizaUseCase,
      inject: [POLIZAS_REPOSITORY],
      useFactory: (repo: PrismaPolizasRepository) => new EliminarPolizaUseCase(repo),
    },
  ],
  exports: [POLIZAS_REPOSITORY],
})
export class PolizasModule {}
