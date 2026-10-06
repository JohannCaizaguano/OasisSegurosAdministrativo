import type { UsuarioCredenciales } from '../../domain/usuario-credenciales';

export const USUARIO_AUTH_REPOSITORY = Symbol('UsuarioAuthRepositoryPort');

export interface UsuarioAuthRepositoryPort {
  buscarPorEmail(email: string): Promise<UsuarioCredenciales | null>;
  buscarPorId(id: string): Promise<UsuarioCredenciales | null>;
  actualizarPasswordHash(id: string, passwordHash: string): Promise<void>;
}
