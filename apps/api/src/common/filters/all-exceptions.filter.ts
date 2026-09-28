import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodError } from 'zod';
import { PinoLogger } from 'nestjs-pino';

import { DomainError } from '../../shared-kernel/domain-error';

const MAPA_DOMINIO: Record<string, number> = {
  VALIDACION: HttpStatus.BAD_REQUEST,
  NO_ENCONTRADO: HttpStatus.NOT_FOUND,
  CONFLICTO: HttpStatus.CONFLICT,
  NO_AUTORIZADO: HttpStatus.UNAUTHORIZED,
  PROHIBIDO: HttpStatus.FORBIDDEN,
  REGLA_NEGOCIO: HttpStatus.UNPROCESSABLE_ENTITY,
  DEPENDENCIA_EXTERNA: HttpStatus.BAD_GATEWAY,
};

interface CuerpoError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{
      id?: string;
      url?: string;
      method?: string;
      headers?: Record<string, unknown>;
    }>();
    const response = ctx.getResponse();

    const requestId =
      typeof request?.id === 'string'
        ? request.id
        : typeof request?.headers?.['x-request-id'] === 'string'
          ? (request.headers['x-request-id'] as string)
          : 'sin-request-id';

    const cuerpo = this.normalizar(exception);
    const path = httpAdapter.getRequestUrl(request);

    if (cuerpo.statusCode >= 500) {
      this.logger.error(
        { err: exception, requestId, path, method: request?.method },
        'Error no controlado',
      );
    } else {
      this.logger.warn(
        { code: cuerpo.code, requestId, path, method: request?.method },
        cuerpo.message,
      );
    }

    httpAdapter.reply(
      response,
      {
        statusCode: cuerpo.statusCode,
        code: cuerpo.code,
        message: cuerpo.message,
        details: cuerpo.details,
        requestId,
        timestamp: new Date().toISOString(),
        path,
      },
      cuerpo.statusCode,
    );
  }

  private normalizar(exception: unknown): CuerpoError {
    if (exception instanceof DomainError) {
      return {
        statusCode: MAPA_DOMINIO[exception.codigo] ?? HttpStatus.UNPROCESSABLE_ENTITY,
        code: exception.codigo,
        message: exception.message,
        details: exception.detalles,
      };
    }

    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDACION',
        message: 'Datos inválidos',
        details: exception.issues,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const respuesta = exception.getResponse();
      const mensaje =
        typeof respuesta === 'string'
          ? respuesta
          : ((respuesta as { message?: string | string[] }).message ?? exception.message);
      return {
        statusCode,
        code: `HTTP_${statusCode}`,
        message: Array.isArray(mensaje) ? mensaje.join(', ') : mensaje,
        details: typeof respuesta === 'object' ? respuesta : undefined,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'ERROR_INTERNO',
      message: 'Error interno del servidor',
    };
  }
}
