import { NoAutorizadoError } from '../../../../shared-kernel/domain-error';
import type { UsuarioCredenciales } from '../../domain/usuario-credenciales';
import type { AlmacenSesionesPort } from '../ports/almacen-sesiones.port';
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
    private readonly sesiones: AlmacenSesionesPort,
  ) {}

  async ejecutar(refreshToken: string): Promise<ResultadoRefresco> {
    const payload = await this.emisor.verificarRefresh(refreshToken);
    if (!payload) {
      throw new NoAutorizadoError('Sesión expirada o inválida');
    }

    const usuario = await this.usuarios.buscarPorId(payload.sub);
    if (!usuario || !usuario.puedeIniciarSesion()) {
      await this.sesiones.cerrar(payload.sub, payload.sid);
      throw new NoAutorizadoError('Usuario no disponible');
    }

    const tokens = await this.emisor.emitir(
      { sub: usuario.id, email: usuario.email, rol: usuario.rol, clienteId: usuario.clienteId },
      { sid: payload.sid, expiraEn: payload.expiraEn },
    );
    const rotacion = await this.sesiones.rotar(
      payload.sub,
      payload.sid,
      payload.jti,
      tokens.refreshJti,
    );
    if (rotacion === 'REUTILIZADA') {
      throw new NoAutorizadoError('Sesión revocada, vuelva a iniciar sesión');
    }
    if (rotacion === 'EXPIRADA') {
      throw new NoAutorizadoError('Sesión expirada, vuelva a iniciar sesión');
    }
    return { usuario, tokens };
  }
}
