import type { Rol } from '@oasis/shared';

export const EMISOR_TOKENS = Symbol('EmisorTokensPort');

export interface PayloadAccess {
  sub: string;
  email: string;
  rol: Rol;
  clienteId?: string | null;
}

/** Familia de rotación: `sid` estable y vencimiento absoluto en segundos desde epoch (ADR-016). */
export interface FamiliaSesion {
  sid: string;
  expiraEn: number;
}

export interface PayloadRefresh {
  sub: string;
  sid: string;
  jti: string;
  expiraEn: number;
}

export interface TokensEmitidos {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
  familia: FamiliaSesion;
}

export interface EmisorTokensPort {
  /** Sin `familia` abre una nueva; con ella la conserva al rotar. */
  emitir(payload: PayloadAccess, familia?: FamiliaSesion): Promise<TokensEmitidos>;
  verificarRefresh(token: string): Promise<PayloadRefresh | null>;
}
