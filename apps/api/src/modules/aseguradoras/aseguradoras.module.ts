import { Module } from '@nestjs/common';

import { ASEGURADORAS_REPOSITORY } from './application/ports/aseguradoras.repository.port';
import {
  ActualizarAseguradoraUseCase,
  CrearAseguradoraUseCase,
  ListarAseguradorasUseCase,
  ObtenerAseguradoraUseCase,
} from './application/use-cases/aseguradoras.use-cases';
import { PrismaAseguradorasRepository } from './infrastructure/persistence/prisma-aseguradoras.repository';
import { AseguradorasController } from './presentation/http/aseguradoras.controller';

@Module({
  controllers: [AseguradorasController],
  providers: [
    { provide: ASEGURADORAS_REPOSITORY, useClass: PrismaAseguradorasRepository },
    {
      provide: CrearAseguradoraUseCase,
      inject: [ASEGURADORAS_REPOSITORY],
      useFactory: (repo: PrismaAseguradorasRepository) => new CrearAseguradoraUseCase(repo),
    },
    {
      provide: ListarAseguradorasUseCase,
      inject: [ASEGURADORAS_REPOSITORY],
      useFactory: (repo: PrismaAseguradorasRepository) => new ListarAseguradorasUseCase(repo),
    },
    {
      provide: ObtenerAseguradoraUseCase,
      inject: [ASEGURADORAS_REPOSITORY],
      useFactory: (repo: PrismaAseguradorasRepository) => new ObtenerAseguradoraUseCase(repo),
    },
    {
      provide: ActualizarAseguradoraUseCase,
      inject: [ASEGURADORAS_REPOSITORY],
      useFactory: (repo: PrismaAseguradorasRepository) => new ActualizarAseguradoraUseCase(repo),
    },
  ],
  exports: [ASEGURADORAS_REPOSITORY],
})
export class AseguradorasModule {}
