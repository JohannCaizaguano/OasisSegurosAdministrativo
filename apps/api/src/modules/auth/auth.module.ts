import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ALMACEN_SESIONES } from './application/ports/almacen-sesiones.port';
import { EMISOR_TOKENS } from './application/ports/emisor-tokens.port';
import { HASHER } from './application/ports/hasher.port';
import { USUARIO_AUTH_REPOSITORY } from './application/ports/usuario-auth.repository.port';
import { CerrarSesionUseCase } from './application/use-cases/cerrar-sesion.use-case';
import { CambiarContrasenaUseCase } from './application/use-cases/cambiar-contrasena.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { ObtenerSesionUseCase } from './application/use-cases/obtener-sesion.use-case';
import { RefrescarSesionUseCase } from './application/use-cases/refrescar-sesion.use-case';
import { PrismaUsuarioAuthRepository } from './infrastructure/persistence/prisma-usuario-auth.repository';
import { Argon2HasherAdapter } from './infrastructure/security/argon2-hasher.adapter';
import { JwtEmisorAdapter } from './infrastructure/security/jwt-emisor.adapter';
import { JwtEstrategia } from './infrastructure/security/jwt.estrategia';
import { RedisAlmacenSesionesAdapter } from './infrastructure/security/redis-almacen-sesiones.adapter';
import { AuthController } from './presentation/http/auth.controller';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    { provide: USUARIO_AUTH_REPOSITORY, useClass: PrismaUsuarioAuthRepository },
    { provide: HASHER, useClass: Argon2HasherAdapter },
    { provide: EMISOR_TOKENS, useClass: JwtEmisorAdapter },
    { provide: ALMACEN_SESIONES, useClass: RedisAlmacenSesionesAdapter },
    JwtEstrategia,
    {
      provide: LoginUseCase,
      inject: [USUARIO_AUTH_REPOSITORY, HASHER, EMISOR_TOKENS, ALMACEN_SESIONES],
      useFactory: (
        usuarios: PrismaUsuarioAuthRepository,
        hasher: Argon2HasherAdapter,
        emisor: JwtEmisorAdapter,
        sesiones: RedisAlmacenSesionesAdapter,
      ) => new LoginUseCase(usuarios, hasher, emisor, sesiones),
    },
    {
      provide: RefrescarSesionUseCase,
      inject: [USUARIO_AUTH_REPOSITORY, EMISOR_TOKENS, ALMACEN_SESIONES],
      useFactory: (
        usuarios: PrismaUsuarioAuthRepository,
        emisor: JwtEmisorAdapter,
        sesiones: RedisAlmacenSesionesAdapter,
      ) => new RefrescarSesionUseCase(usuarios, emisor, sesiones),
    },
    {
      provide: CerrarSesionUseCase,
      inject: [EMISOR_TOKENS, ALMACEN_SESIONES],
      useFactory: (emisor: JwtEmisorAdapter, sesiones: RedisAlmacenSesionesAdapter) =>
        new CerrarSesionUseCase(emisor, sesiones),
    },
    {
      provide: ObtenerSesionUseCase,
      inject: [USUARIO_AUTH_REPOSITORY],
      useFactory: (usuarios: PrismaUsuarioAuthRepository) => new ObtenerSesionUseCase(usuarios),
    },
    {
      provide: CambiarContrasenaUseCase,
      inject: [USUARIO_AUTH_REPOSITORY, HASHER, ALMACEN_SESIONES],
      useFactory: (
        usuarios: PrismaUsuarioAuthRepository,
        hasher: Argon2HasherAdapter,
        sesiones: RedisAlmacenSesionesAdapter,
      ) => new CambiarContrasenaUseCase(usuarios, hasher, sesiones),
    },
  ],
  exports: [HASHER],
})
export class AuthModule {}
