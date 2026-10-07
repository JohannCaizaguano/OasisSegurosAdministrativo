import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { BITACORA_REPOSITORY } from './application/ports/bitacora.repository.port';
import type { BitacoraRepositoryPort } from './application/ports/bitacora.repository.port';
import {
  ListarBitacoraUseCase,
  ListarUsuariosBitacoraUseCase,
  RegistrarAccionUseCase,
} from './application/use-cases/auditoria.use-cases';
import { PrismaBitacoraRepository } from './infrastructure/persistence/prisma-bitacora.repository';
import { AuditoriaInterceptor } from './presentation/http/auditoria.interceptor';
import { BitacoraController } from './presentation/http/bitacora.controller';

@Module({
  controllers: [BitacoraController],
  providers: [
    { provide: BITACORA_REPOSITORY, useClass: PrismaBitacoraRepository },
    {
      provide: RegistrarAccionUseCase,
      inject: [BITACORA_REPOSITORY],
      useFactory: (repo: BitacoraRepositoryPort) => new RegistrarAccionUseCase(repo),
    },
    {
      provide: ListarBitacoraUseCase,
      inject: [BITACORA_REPOSITORY],
      useFactory: (repo: BitacoraRepositoryPort) => new ListarBitacoraUseCase(repo),
    },
    {
      provide: ListarUsuariosBitacoraUseCase,
      inject: [BITACORA_REPOSITORY],
      useFactory: (repo: BitacoraRepositoryPort) => new ListarUsuariosBitacoraUseCase(repo),
    },
    // Global aunque se declare aquí: aplica a todos los controladores del API, no al worker.
    { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor },
  ],
})
export class AuditoriaModule {}
