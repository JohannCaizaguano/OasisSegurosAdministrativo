import { NoAutorizadoError } from '../../../../shared-kernel/domain-error';
import type { UsuarioCredenciales } from '../../domain/usuario-credenciales';
import type { AlmacenRefreshPort } from '../ports/almacen-refresh.port';
import type { EmisorTokensPort, TokensEmitidos } from '../ports/emisor-tokens.port';
import type { HasherPort } from '../ports/hasher.port';
import type { UsuarioAuthRepositoryPort } from '../ports/usuario-auth.repository.port';

export interface ResultadoLogin {
  usuario: UsuarioCredenciales;
  tokens: TokensEmitidos;
}

export class LoginUseCase {
  constructor(
    private readonly usuarios: UsuarioAuthRepositoryPort,
    private readonly hasher: HasherPort,
    private readonly emisor: EmisorTokensPort,
    private readonly almacen: AlmacenRefreshPort,
  ) {}

  async ejecutar(email: string, password: string): Promise<ResultadoLogin> {
    const usuario = await this.usuarios.buscarPorEmail(email.toLowerCase().trim());

    // Mismo error para usuario inexistente y contraseña incorrecta:
    // evita enumeración de cuentas.
    if (!usuario || !usuario.puedeIniciarSesion()) {
      throw new NoAutorizadoError('Credenciales inválidas');
    }

    const valida = await this.hasher.verificar(usuario.passwordHash, password);
    if (!valida) {
      throw new NoAutorizadoError('Credenciales inválidas');
    }

    const tokens = await this.emisor.emitir({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      clienteId: usuario.clienteId,
    });

    await this.almacen.guardar(usuario.id, tokens.refreshJti);

    return { usuario, tokens };
  }
}
