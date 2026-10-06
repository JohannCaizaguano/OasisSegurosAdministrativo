import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ALMACEN_SESIONES } from '../auth/application/ports/almacen-sesiones.port';
import { HASHER } from '../auth/application/ports/hasher.port';
import type { AlmacenSesionesPort } from '../auth/application/ports/almacen-sesiones.port';
import type { HasherPort } from '../auth/application/ports/hasher.port';
import { GENERADOR_CONTRASENA } from './application/ports/generador-contrasena.port';
import { USUARIOS_REPOSITORY } from './application/ports/usuarios.repository.port';
import type { GeneradorContrasenaPort } from './application/ports/generador-contrasena.port';
import { CrearUsuarioUseCase } from './application/use-cases/crear-usuario.use-case';
import { DesactivarUsuarioUseCase } from './application/use-cases/desactivar-usuario.use-case';
import { EditarUsuarioUseCase } from './application/use-cases/editar-usuario.use-case';
import { ListarUsuariosUseCase } from './application/use-cases/listar-usuarios.use-case';
import { ReactivarUsuarioUseCase } from './application/use-cases/reactivar-usuario.use-case';
import { RestablecerContrasenaUseCase } from './application/use-cases/restablecer-contrasena.use-case';
import { PrismaUsuariosRepository } from './infrastructure/persistence/prisma-usuarios.repository';
import { CryptoGeneradorContrasenaAdapter } from './infrastructure/security/crypto-generador-contrasena.adapter';
import { UsuariosController } from './presentation/http/usuarios.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsuariosController],
  providers: [
    { provide: USUARIOS_REPOSITORY, useClass: PrismaUsuariosRepository },
    { provide: GENERADOR_CONTRASENA, useClass: CryptoGeneradorContrasenaAdapter },
    {
      provide: ListarUsuariosUseCase,
      inject: [USUARIOS_REPOSITORY],
      useFactory: (repo: PrismaUsuariosRepository) => new ListarUsuariosUseCase(repo),
    },
    {
      provide: CrearUsuarioUseCase,
      inject: [USUARIOS_REPOSITORY, GENERADOR_CONTRASENA, HASHER],
      useFactory: (
        repo: PrismaUsuariosRepository,
        generador: GeneradorContrasenaPort,
        hasher: HasherPort,
      ) => new CrearUsuarioUseCase(repo, generador, hasher),
    },
    {
      provide: EditarUsuarioUseCase,
      inject: [USUARIOS_REPOSITORY, ALMACEN_SESIONES],
      useFactory: (repo: PrismaUsuariosRepository, sesiones: AlmacenSesionesPort) =>
        new EditarUsuarioUseCase(repo, sesiones),
    },
    {
      provide: DesactivarUsuarioUseCase,
      inject: [USUARIOS_REPOSITORY, ALMACEN_SESIONES],
      useFactory: (repo: PrismaUsuariosRepository, sesiones: AlmacenSesionesPort) =>
        new DesactivarUsuarioUseCase(repo, sesiones),
    },
    {
      provide: ReactivarUsuarioUseCase,
      inject: [USUARIOS_REPOSITORY],
      useFactory: (repo: PrismaUsuariosRepository) => new ReactivarUsuarioUseCase(repo),
    },
    {
      provide: RestablecerContrasenaUseCase,
      inject: [USUARIOS_REPOSITORY, GENERADOR_CONTRASENA, HASHER, ALMACEN_SESIONES],
      useFactory: (
        repo: PrismaUsuariosRepository,
        generador: GeneradorContrasenaPort,
        hasher: HasherPort,
        sesiones: AlmacenSesionesPort,
      ) => new RestablecerContrasenaUseCase(repo, generador, hasher, sesiones),
    },
  ],
})
export class UsuariosModule {}
