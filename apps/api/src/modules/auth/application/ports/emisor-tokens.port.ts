import type { Rol } from '@oasis/shared';

export const EMISOR_TOKENS = Symbol('EmisorTokensPort');

export interface PayloadAccess {
  sub: string;
  email: string;
  rol: Rol;
  clienteId?: string | null;
}

export interface PayloadRefresh {
  sub: string;
  jti: string;
}

export interface TokensEmitidos {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
}

export interface EmisorTokensPort {
  emitir(payload: PayloadAccess): Promise<TokensEmitidos>;
  verificarRefresh(token: string): Promise<PayloadRefresh | null>;
}
