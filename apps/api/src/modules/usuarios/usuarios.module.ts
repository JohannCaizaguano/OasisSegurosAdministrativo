import { Module } from '@nestjs/common';

import { USUARIOS_REPOSITORY } from './application/ports/usuarios.repository.port';
import { ListarUsuariosUseCase } from './application/use-cases/listar-usuarios.use-case';
import { PrismaUsuariosRepository } from './infrastructure/persistence/prisma-usuarios.repository';
import { UsuariosController } from './presentation/http/usuarios.controller';

@Module({
  controllers: [UsuariosController],
  providers: [
    { provide: USUARIOS_REPOSITORY, useClass: PrismaUsuariosRepository },
    {
      provide: ListarUsuariosUseCase,
      inject: [USUARIOS_REPOSITORY],
      useFactory: (repo: PrismaUsuariosRepository) => new ListarUsuariosUseCase(repo),
    },
  ],
})
export class UsuariosModule {}
