import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';

import { LIMITE_VERIFICACION } from '../../config/throttle';
import { DemasiadasConsultasError } from '../../shared-kernel/domain-error';
import type { UsuarioAutenticado } from '../auth/decorators';

/**
 * Límite de la verificación por usuario (D4). Se aplica con `@UseGuards` en el handler: corre
 * después de los guards globales y ya conoce `req.user`, que el `ThrottlerGuard` global no ve.
 */
@Injectable()
export class LimitePorUsuarioGuard implements CanActivate {
  private readonly almacen: ThrottlerStorage;

  // El worker importa RecibosModule sin ThrottlerModule: ahí el guard nunca corre, pero debe
  // poder instanciarse.
  constructor(@Optional() @Inject(ThrottlerStorage) almacen?: ThrottlerStorage) {
    this.almacen = almacen ?? new ThrottlerStorageService();
  }

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const http = contexto.switchToHttp();
    const { user } = http.getRequest<{ user: UsuarioAutenticado }>();
    const { limite, ventanaMs } = LIMITE_VERIFICACION;
    const { isBlocked, timeToBlockExpire } = await this.almacen.increment(
      `verificacion:${user.id}`,
      ventanaMs,
      limite,
      ventanaMs,
      'verificacion',
    );
    if (isBlocked) {
      const segundos = Math.max(1, timeToBlockExpire);
      http
        .getResponse<{ setHeader(nombre: string, valor: string): void }>()
        .setHeader('Retry-After', String(segundos));
      throw new DemasiadasConsultasError(segundos);
    }
    return true;
  }
}
