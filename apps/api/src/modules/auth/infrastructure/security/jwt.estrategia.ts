import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AppConfig } from '../../../../config/app.config';
import { NoAutorizadoError } from '../../../../shared-kernel/domain-error';
import type { UsuarioAutenticado } from '../../../../common/auth/decorators';
import type { Rol } from '@oasis/shared';
import {
  ALMACEN_SESIONES,
  type AlmacenSesionesPort,
} from '../../application/ports/almacen-sesiones.port';

interface PayloadJwt {
  sub: string;
  email: string;
  rol: Rol;
  clienteId?: string | null;
  sid?: string;
}

@Injectable()
export class JwtEstrategia extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: AppConfig,
    @Inject(ALMACEN_SESIONES) private readonly sesiones: AlmacenSesionesPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.auth.accessSecret,
    });
  }

  async validate(payload: PayloadJwt): Promise<UsuarioAutenticado> {
    // Una sesión cerrada (logout, cambio de contraseña, inactividad) invalida su access token al instante.
    if (!payload.sid || !(await this.sesiones.tocar(payload.sub, payload.sid))) {
      throw new NoAutorizadoError('La sesión se cerró; inicie sesión de nuevo');
    }
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      clienteId: payload.clienteId ?? null,
      sid: payload.sid,
    };
  }
}
