import { NoAutorizadoError } from '../../../../shared-kernel/domain-error';
import type { UsuarioCredenciales } from '../../domain/usuario-credenciales';
import type { AlmacenRefreshPort } from '../ports/almacen-refresh.port';
import type { EmisorTokensPort, TokensEmitidos } from '../ports/emisor-tokens.port';
import type { UsuarioAuthRepositoryPort } from '../ports/usuario-auth.repository.port';

export interface ResultadoRefresco {
  usuario: UsuarioCredenciales;
  tokens: TokensEmitidos;
}

export class RefrescarSesionUseCase {
  constructor(
    private readonly usuarios: UsuarioAuthRepositoryPort,
    private readonly emisor: EmisorTokensPort,
    private readonly almacen: AlmacenRefreshPort,
  ) {}

  async ejecutar(refreshToken: string): Promise<ResultadoRefresco> {
    const payload = await this.emisor.verificarRefresh(refreshToken);
    if (!payload) {
      throw new NoAutorizadoError('Sesión expirada o inválida');
    }

    const vigente = await this.almacen.consumir(payload.sub, payload.jti);
    if (!vigente) {
      // El jti no existe: token reutilizado o revocado. Se cierran todas las
      // sesiones del usuario como medida defensiva.
      await this.almacen.revocarTodos(payload.sub);
      throw new NoAutorizadoError('Sesión revocada, vuelva a iniciar sesión');
    }

    const usuario = await this.usuarios.buscarPorId(payload.sub);
    if (!usuario || !usuario.puedeIniciarSesion()) {
      throw new NoAutorizadoError('Usuario no disponible');
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
