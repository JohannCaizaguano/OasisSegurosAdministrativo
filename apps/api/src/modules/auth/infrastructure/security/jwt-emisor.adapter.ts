import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';

import { AppConfig } from '../../../../config/app.config';
import type {
  EmisorTokensPort,
  PayloadAccess,
  PayloadRefresh,
  TokensEmitidos,
} from '../../application/ports/emisor-tokens.port';

@Injectable()
export class JwtEmisorAdapter implements EmisorTokensPort {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  async emitir(payload: PayloadAccess): Promise<TokensEmitidos> {
    const { accessSecret, refreshSecret, accessTtl, refreshTtl } = this.config.auth;
    const refreshJti = randomUUID();

    const accessToken = await this.jwt.signAsync(
      { sub: payload.sub, email: payload.email, rol: payload.rol, clienteId: payload.clienteId },
      {
        secret: accessSecret,
        expiresIn: accessTtl as JwtSignOptions['expiresIn'],
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: payload.sub, jti: refreshJti },
      {
        secret: refreshSecret,
        expiresIn: refreshTtl as JwtSignOptions['expiresIn'],
      },
    );

    return { accessToken, refreshToken, refreshJti };
  }

  async verificarRefresh(token: string): Promise<PayloadRefresh | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; jti: string }>(token, {
        secret: this.config.auth.refreshSecret,
      });
      return { sub: payload.sub, jti: payload.jti };
    } catch {
      return null;
    }
  }
}
