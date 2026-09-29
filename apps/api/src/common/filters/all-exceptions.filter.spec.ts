import type { ArgumentsHost } from '@nestjs/common';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import type { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';

import {
  ConflictoError,
  ErrorDependenciaExterna,
  NoAutorizadoError,
  NoEncontradoError,
  ProhibidoError,
  ReglaNegocioError,
  ValidacionError,
} from '../../shared-kernel/domain-error';
import { AllExceptionsFilter } from './all-exceptions.filter';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';

interface RespuestaCapturada {
  cuerpo: Record<string, unknown>;
  status: number;
}

function crearLoggerFalso() {
  return {
    setContext: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
}

function capturar(
  exception: unknown,
  request: { id?: string; headers?: Record<string, string> } = { id: REQUEST_ID },
): { capturada: RespuestaCapturada; logger: ReturnType<typeof crearLoggerFalso> } {
  const capturada: RespuestaCapturada = { cuerpo: {}, status: 0 };
  const logger = crearLoggerFalso();

  const httpAdapterHost = {
    httpAdapter: {
      reply: (_respuesta: unknown, cuerpo: Record<string, unknown>, status: number): void => {
        capturada.cuerpo = cuerpo;
        capturada.status = status;
      },
      getRequestUrl: (): string => '/api/v1/polizas/00000000-0000-4000-8000-000000000000',
    },
  } as unknown as HttpAdapterHost;

  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/api/v1/polizas', ...request }),
      getResponse: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  const filtro = new AllExceptionsFilter(httpAdapterHost, logger as unknown as PinoLogger);
  filtro.catch(exception, host);

  return { capturada, logger };
}

describe('Filtro global de excepciones', () => {
  it('devuelve el formato uniforme con requestId, timestamp y path', () => {
    const { capturada } = capturar(new NoEncontradoError('Póliza', 'abc'));

    expect(capturada.status).toBe(HttpStatus.NOT_FOUND);
    expect(capturada.cuerpo).toMatchObject({
      statusCode: 404,
      code: 'NO_ENCONTRADO',
      message: 'Póliza no encontrado: abc',
      requestId: REQUEST_ID,
      path: '/api/v1/polizas/00000000-0000-4000-8000-000000000000',
    });
    expect(capturada.cuerpo.timestamp).toEqual(expect.any(String));
    expect(new Date(capturada.cuerpo.timestamp as string).toISOString()).toBe(
      capturada.cuerpo.timestamp,
    );
  });

  it.each([
    [new ValidacionError('Datos inválidos'), HttpStatus.BAD_REQUEST],
    [new NoEncontradoError('Cliente'), HttpStatus.NOT_FOUND],
    [new ConflictoError('Identificación duplicada'), HttpStatus.CONFLICT],
    [new NoAutorizadoError('Sesión vencida'), HttpStatus.UNAUTHORIZED],
    [new ProhibidoError('Rol insuficiente'), HttpStatus.FORBIDDEN],
    [new ReglaNegocioError('La póliza no está vigente'), HttpStatus.UNPROCESSABLE_ENTITY],
    [new ErrorDependenciaExterna('El RPC no responde'), HttpStatus.BAD_GATEWAY],
  ])('traduce %p a %i', (error, esperado) => {
    const { capturada } = capturar(error);

    expect(capturada.status).toBe(esperado);
    expect(capturada.cuerpo.statusCode).toBe(esperado);
    expect(capturada.cuerpo.message).toBe((error as Error).message);
    expect(capturada.cuerpo.requestId).toBe(REQUEST_ID);
  });

  it('conserva el código HTTP de las excepciones de NestJS', () => {
    const { capturada } = capturar(new NotFoundException('Ruta no encontrada'));

    expect(capturada.status).toBe(HttpStatus.NOT_FOUND);
    expect(capturada.cuerpo.code).toBe('HTTP_404');
    expect(capturada.cuerpo.message).toBe('Ruta no encontrada');
  });

  it('traduce los errores de validación de Zod con su detalle', () => {
    const resultado = z.object({ email: z.email() }).safeParse({ email: 'no-es-correo' });
    const { capturada } = capturar(resultado.error);

    expect(capturada.status).toBe(HttpStatus.BAD_REQUEST);
    expect(capturada.cuerpo.code).toBe('VALIDACION');
    expect(Array.isArray(capturada.cuerpo.details)).toBe(true);
  });

  it('no filtra el stack ni el mensaje interno en un error inesperado', () => {
    const { capturada, logger } = capturar(new Error('cadena de conexión: postgres://secreto'));

    expect(capturada.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(capturada.cuerpo).toEqual({
      statusCode: 500,
      code: 'ERROR_INTERNO',
      message: 'Error interno del servidor',
      details: undefined,
      requestId: REQUEST_ID,
      timestamp: expect.any(String),
      path: expect.any(String),
    });
    expect(JSON.stringify(capturada.cuerpo)).not.toContain('postgres://secreto');
    // El detalle completo queda en el log, con el requestId.
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: REQUEST_ID }),
      'Error no controlado',
    );
  });

  it('usa el x-request-id entrante cuando la petición no trae id resuelto', () => {
    const { capturada } = capturar(new ValidacionError('Datos inválidos'), {
      headers: { 'x-request-id': REQUEST_ID },
    });

    expect(capturada.cuerpo.requestId).toBe(REQUEST_ID);
    expect(UUID_RE.test(capturada.cuerpo.requestId as string)).toBe(true);
  });

  it('usa un marcador cuando no hay ninguna pista de requestId', () => {
    const { capturada } = capturar(new ValidacionError('Datos inválidos'), {});

    expect(capturada.cuerpo.requestId).toBe('sin-request-id');
  });
});
