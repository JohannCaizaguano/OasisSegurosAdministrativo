import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';

import { AppConfig } from '../../../../config/app.config';
import { duracionASegundos } from '../../../../shared-kernel/duracion';
import type {
  EmisorTokensPort,
  FamiliaSesion,
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

  async emitir(payload: PayloadAccess, familia?: FamiliaSesion): Promise<TokensEmitidos> {
    const { accessSecret, refreshSecret, accessTtl, refreshTtl } = this.config.auth;
    const vigente: FamiliaSesion = familia ?? {
      sid: randomUUID(),
      expiraEn: Math.floor(Date.now() / 1_000) + duracionASegundos(refreshTtl),
    };
    const refreshJti = randomUUID();

    const accessToken = await this.jwt.signAsync(
      {
        sub: payload.sub,
        email: payload.email,
        rol: payload.rol,
        clienteId: payload.clienteId,
        sid: vigente.sid,
      },
      { secret: accessSecret, expiresIn: accessTtl as JwtSignOptions['expiresIn'] },
    );
    // `exp` explícito: la rotación conserva el vencimiento absoluto de la familia (D8).
    const refreshToken = await this.jwt.signAsync(
      { sub: payload.sub, sid: vigente.sid, jti: refreshJti, exp: vigente.expiraEn },
      { secret: refreshSecret },
    );

    return { accessToken, refreshToken, refreshJti, familia: vigente };
  }

  async verificarRefresh(token: string): Promise<PayloadRefresh | null> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        sid?: string;
        jti: string;
        exp: number;
      }>(token, { secret: this.config.auth.refreshSecret });
      // Los tokens emitidos antes de las familias no traen `sid` y ya no abren sesión.
      if (!payload.sid) {
        return null;
      }
      return { sub: payload.sub, sid: payload.sid, jti: payload.jti, expiraEn: payload.exp };
    } catch {
      return null;
    }
  }
}
