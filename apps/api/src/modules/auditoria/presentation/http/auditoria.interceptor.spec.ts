import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom, of, throwError } from 'rxjs';

import { AUDITAR_KEY } from '../../../../common/auditoria/auditar.decorator';
import { RegistrarAccionUseCase } from '../../application/use-cases/auditoria.use-cases';
import type { NuevoRegistroAuditoria } from '../../domain/registro-auditoria';
import { AuditoriaInterceptor } from './auditoria.interceptor';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';
const CLIENTE_ID = '22222222-2222-2222-2222-222222222222';

interface PeticionFalsa {
  method: string;
  path: string;
  route?: { path?: string };
  ip?: string;
  id?: unknown;
  params?: Record<string, string | undefined>;
  body?: unknown;
  user?: { id: string };
}

function espiaRegistrar() {
  const registros: NuevoRegistroAuditoria[] = [];
  const estado = { falla: false };
  const useCase = {
    ejecutar: async (registro: NuevoRegistroAuditoria) => {
      if (estado.falla) {
        throw new Error('falló la inserción');
      }
      registros.push(registro);
    },
  } as unknown as RegistrarAccionUseCase;
  return { useCase, registros, estado };
}

function espiaLogger() {
  return {
    setContext: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
}

function handlerCon(
  accion?: 'CREAR' | 'MODIFICAR' | 'INICIAR_SESION',
  entidad?: 'Cliente' | 'Usuario',
) {
  const handler = () => undefined;
  if (accion && entidad) {
    Reflect.defineMetadata(AUDITAR_KEY, { accion, entidad }, handler);
  }
  return handler;
}

function contexto(peticion: PeticionFalsa, handler: () => void): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => peticion }),
  } as unknown as ExecutionContext;
}

function manejador(respuesta: unknown): CallHandler {
  return { handle: () => of(respuesta) } as unknown as CallHandler;
}

function interceptor() {
  const espia = espiaRegistrar();
  const logger = espiaLogger();
  return {
    ...espia,
    logger,
    auditor: new AuditoriaInterceptor(new Reflector(), espia.useCase, logger),
  };
}

describe('AuditoriaInterceptor', () => {
  it('registra con el usuario autenticado, la IP y el id de la ruta', async () => {
    const { auditor, registros } = interceptor();
    const peticion: PeticionFalsa = {
      method: 'PATCH',
      path: '/api/v1/clientes/22222222-2222-2222-2222-222222222222',
      route: { path: '/api/v1/clientes/:id' },
      ip: '10.0.0.7',
      id: 'req-1',
      params: { id: CLIENTE_ID },
      body: { telefono: '0991234567' },
      user: { id: USUARIO_ID },
    };

    const respuesta = { id: CLIENTE_ID };
    const resultado = await lastValueFrom(
      auditor.intercept(
        contexto(peticion, handlerCon('MODIFICAR', 'Cliente')),
        manejador(respuesta),
      ),
    );

    expect(resultado).toBe(respuesta);
    expect(registros).toEqual([
      {
        usuarioId: USUARIO_ID,
        accion: 'MODIFICAR',
        entidad: 'Cliente',
        entidadId: CLIENTE_ID,
        ip: '10.0.0.7',
        detalle: {
          metodo: 'PATCH',
          ruta: '/api/v1/clientes/:id',
          requestId: 'req-1',
          campos: ['telefono'],
        },
      },
    ]);
  });

  it('en el inicio de sesión toma el usuario de la respuesta', async () => {
    const { auditor, registros } = interceptor();
    const peticion: PeticionFalsa = {
      method: 'POST',
      path: '/api/v1/auth/login',
      route: { path: '/api/v1/auth/login' },
      ip: '10.0.0.8',
      id: 'req-2',
      params: {},
    };

    await lastValueFrom(
      auditor.intercept(
        contexto(peticion, handlerCon('INICIAR_SESION', 'Usuario')),
        manejador({ usuario: { id: USUARIO_ID } }),
      ),
    );

    expect(registros[0]).toEqual({
      usuarioId: USUARIO_ID,
      accion: 'INICIAR_SESION',
      entidad: 'Usuario',
      entidadId: USUARIO_ID,
      ip: '10.0.0.8',
      detalle: {
        metodo: 'POST',
        ruta: '/api/v1/auth/login',
        requestId: 'req-2',
      },
    });
  });

  it('en una creación toma el id de la respuesta', async () => {
    const { auditor, registros } = interceptor();
    const peticion: PeticionFalsa = {
      method: 'POST',
      path: '/api/v1/clientes',
      route: { path: '/api/v1/clientes' },
      ip: '10.0.0.9',
      id: 'req-3',
      params: {},
      user: { id: USUARIO_ID },
    };

    await lastValueFrom(
      auditor.intercept(
        contexto(peticion, handlerCon('CREAR', 'Cliente')),
        manejador({ id: CLIENTE_ID }),
      ),
    );

    expect(registros[0].entidadId).toBe(CLIENTE_ID);
    expect(registros[0].accion).toBe('CREAR');
  });

  it('en una modificación guarda los nombres de los campos y no sus valores', async () => {
    const { auditor, registros } = interceptor();
    const peticion: PeticionFalsa = {
      method: 'PATCH',
      path: `/api/v1/clientes/${CLIENTE_ID}`,
      route: { path: '/api/v1/clientes/:id' },
      id: 'req-4',
      params: { id: CLIENTE_ID },
      body: { telefono: '0991234567', nombres: 'Ana' },
      user: { id: USUARIO_ID },
    };

    await lastValueFrom(
      auditor.intercept(contexto(peticion, handlerCon('MODIFICAR', 'Cliente')), manejador({})),
    );

    expect(registros[0].detalle.campos).toEqual(['nombres', 'telefono']);
    expect(JSON.stringify(registros[0].detalle)).not.toContain('0991234567');
    expect(JSON.stringify(registros[0].detalle)).not.toContain('Ana');
  });

  it('no registra nada si el handler falla', async () => {
    const { auditor, registros, logger } = interceptor();
    const peticion: PeticionFalsa = {
      method: 'POST',
      path: '/api/v1/clientes',
      id: 'req-5',
      params: {},
      user: { id: USUARIO_ID },
    };
    const falla = {
      handle: () => throwError(() => new Error('boom')),
    } as unknown as CallHandler;

    await expect(
      lastValueFrom(auditor.intercept(contexto(peticion, handlerCon('CREAR', 'Cliente')), falla)),
    ).rejects.toThrow('boom');

    expect(registros).toHaveLength(0);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('entrega la respuesta aunque falle la inserción y lo deja en el log', async () => {
    const { auditor, registros, logger, estado } = interceptor();
    estado.falla = true;
    const peticion: PeticionFalsa = {
      method: 'POST',
      path: '/api/v1/clientes',
      id: 'req-6',
      params: {},
      user: { id: USUARIO_ID },
    };
    const respuesta = { id: CLIENTE_ID };

    const resultado = await lastValueFrom(
      auditor.intercept(contexto(peticion, handlerCon('CREAR', 'Cliente')), manejador(respuesta)),
    );

    expect(resultado).toBe(respuesta);
    expect(registros).toHaveLength(0);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-6', accion: 'CREAR', entidad: 'Cliente' }),
      'No se pudo registrar la acción en la bitácora',
    );
  });

  it('ignora los handlers sin @Auditar', async () => {
    const { auditor, registros } = interceptor();
    const peticion: PeticionFalsa = {
      method: 'GET',
      path: '/api/v1/clientes',
      id: 'req-7',
      params: {},
      user: { id: USUARIO_ID },
    };

    const resultado = await lastValueFrom(
      auditor.intercept(contexto(peticion, handlerCon()), manejador({ data: [] })),
    );

    expect(resultado).toEqual({ data: [] });
    expect(registros).toHaveLength(0);
  });
});
