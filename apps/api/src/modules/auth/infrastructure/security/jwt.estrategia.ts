import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AppConfig } from '../../../../config/app.config';
import type { UsuarioAutenticado } from '../../../../common/auth/decorators';
import type { Rol } from '@oasis/shared';

interface PayloadJwt {
  sub: string;
  email: string;
  rol: Rol;
  clienteId?: string | null;
}

@Injectable()
export class JwtEstrategia extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: AppConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.auth.accessSecret,
    });
  }

  validate(payload: PayloadJwt): UsuarioAutenticado {
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      clienteId: payload.clienteId ?? null,
    };
  }
}
