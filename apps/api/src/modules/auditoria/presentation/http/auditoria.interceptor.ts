import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { Observable, concatMap } from 'rxjs';

import {
  AUDITAR_KEY,
  type MetadatoAuditoria,
} from '../../../../common/auditoria/auditar.decorator';
import type { UsuarioAutenticado } from '../../../../common/auth/decorators';
import { RegistrarAccionUseCase } from '../../application/use-cases/auditoria.use-cases';
import { construirDetalle } from '../../domain/registro-auditoria';

/** Lo mínimo que el interceptor necesita de la petición de Express. */
interface PeticionAuditable {
  method: string;
  path: string;
  ip?: string;
  id?: unknown;
  params?: Record<string, string | undefined>;
  body?: unknown;
  route?: { path?: string };
  user?: UsuarioAutenticado;
}

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly registrarAccion: RegistrarAccionUseCase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuditoriaInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadato = this.reflector.get<MetadatoAuditoria | undefined>(
      AUDITAR_KEY,
      context.getHandler(),
    );
    if (!metadato || context.getType() !== 'http') {
      return next.handle();
    }

    const peticion = context.switchToHttp().getRequest<PeticionAuditable>();
    // Se espera la inserción para que el registro exista al responder; si falla, no rompe la respuesta.
    return next.handle().pipe(
      concatMap(async (respuesta: unknown) => {
        await this.registrar(metadato, peticion, respuesta);
        return respuesta;
      }),
    );
  }

  private async registrar(
    metadato: MetadatoAuditoria,
    peticion: PeticionAuditable,
    respuesta: unknown,
  ): Promise<void> {
    const requestId = typeof peticion.id === 'string' ? peticion.id : null;
    const usuarioId = peticion.user?.id ?? leerId(respuesta, 'usuario');
    if (!usuarioId) {
      this.logger.warn({ requestId, ...metadato }, 'Acción auditada sin usuario identificable');
      return;
    }

    try {
      await this.registrarAccion.ejecutar({
        usuarioId,
        accion: metadato.accion,
        entidad: metadato.entidad,
        entidadId:
          peticion.params?.id ??
          leerId(respuesta) ??
          leerId(respuesta, 'usuario') ??
          // Sin id explícito, quien actúa sobre Usuario es el propio usuario (login, cambio de contraseña).
          (metadato.entidad === 'Usuario' ? usuarioId : null),
        ip: peticion.ip ?? null,
        detalle: construirDetalle(metadato.accion, {
          metodo: peticion.method,
          ruta: peticion.route?.path ?? peticion.path,
          requestId,
          cuerpo: peticion.body,
        }),
      });
    } catch (error) {
      this.logger.error(
        { err: error, requestId, ...metadato },
        'No se pudo registrar la acción en la bitácora',
      );
    }
  }
}

/** Devuelve `respuesta.id`, o `respuesta[clave].id` si se indica `clave`, cuando es texto. */
function leerId(respuesta: unknown, clave?: string): string | undefined {
  const objetivo =
    clave && typeof respuesta === 'object' && respuesta !== null
      ? (respuesta as Record<string, unknown>)[clave]
      : respuesta;
  if (typeof objetivo !== 'object' || objetivo === null) {
    return undefined;
  }
  const id = (objetivo as Record<string, unknown>)['id'];
  return typeof id === 'string' ? id : undefined;
}
