import { Module } from '@nestjs/common';

import { CLIENTES_REPOSITORY } from './application/ports/clientes.repository.port';
import {
  ActualizarClienteUseCase,
  CrearClienteUseCase,
  ListarClientesUseCase,
  ObtenerClienteUseCase,
} from './application/use-cases/clientes.use-cases';
import { PrismaClientesRepository } from './infrastructure/persistence/prisma-clientes.repository';
import { ClientesController } from './presentation/http/clientes.controller';

@Module({
  controllers: [ClientesController],
  providers: [
    { provide: CLIENTES_REPOSITORY, useClass: PrismaClientesRepository },
    {
      provide: CrearClienteUseCase,
      inject: [CLIENTES_REPOSITORY],
      useFactory: (repo: PrismaClientesRepository) => new CrearClienteUseCase(repo),
    },
    {
      provide: ListarClientesUseCase,
      inject: [CLIENTES_REPOSITORY],
      useFactory: (repo: PrismaClientesRepository) => new ListarClientesUseCase(repo),
    },
    {
      provide: ObtenerClienteUseCase,
      inject: [CLIENTES_REPOSITORY],
      useFactory: (repo: PrismaClientesRepository) => new ObtenerClienteUseCase(repo),
    },
    {
      provide: ActualizarClienteUseCase,
      inject: [CLIENTES_REPOSITORY],
      useFactory: (repo: PrismaClientesRepository) => new ActualizarClienteUseCase(repo),
    },
  ],
  exports: [CLIENTES_REPOSITORY],
})
export class ClientesModule {}
