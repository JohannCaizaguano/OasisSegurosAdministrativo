import type { AlmacenSesionesPort } from '../ports/almacen-sesiones.port';
import type { EmisorTokensPort } from '../ports/emisor-tokens.port';

export class CerrarSesionUseCase {
  constructor(
    private readonly emisor: EmisorTokensPort,
    private readonly sesiones: AlmacenSesionesPort,
  ) {}

  async ejecutar(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }
    const payload = await this.emisor.verificarRefresh(refreshToken);
    if (payload) {
      // Por `sid`: cierra la sesión aunque otra pestaña ya haya rotado el jti.
      await this.sesiones.cerrar(payload.sub, payload.sid);
    }
  }
}
