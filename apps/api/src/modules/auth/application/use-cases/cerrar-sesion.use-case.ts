import type { AlmacenRefreshPort } from '../ports/almacen-refresh.port';
import type { EmisorTokensPort } from '../ports/emisor-tokens.port';

export class CerrarSesionUseCase {
  constructor(
    private readonly emisor: EmisorTokensPort,
    private readonly almacen: AlmacenRefreshPort,
  ) {}

  async ejecutar(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }
    const payload = await this.emisor.verificarRefresh(refreshToken);
    if (payload) {
      await this.almacen.revocar(payload.sub, payload.jti);
    }
  }
}
