import type { LoginResponse, UsuarioSesion } from '@oasis/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiFetch, configurarApiClient, refrescarToken, type Sesion } from './api-client';

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const USUARIO: UsuarioSesion = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'operador@oasis.com',
  rol: 'OPERADOR',
  nombre: 'Operador',
  clienteId: null,
};

function respuestaLogin(token: string): LoginResponse {
  return { accessToken: token, usuario: USUARIO };
}

let estado: Sesion;
let limpiarCache: () => unknown;

beforeEach(() => {
  // Réplica fiel del store de zustand: `establecerSesion` sí actualiza el
  // token. Con un `vi.fn()` vacío el reintento tras el 401 volvería a enviar
  // el token caducado y el test probaría algo que no ocurre en la app.
  estado = {
    accessToken: null,
    establecerSesion: vi.fn((respuesta: LoginResponse) => {
      estado.accessToken = respuesta.accessToken;
    }),
    cerrarSesionLocal: vi.fn(() => {
      estado.accessToken = null;
    }),
  };
  const espiaLimpieza = vi.fn();
  limpiarCache = espiaLimpieza;
  // El mock necesita recibir llamadas para poder asercionarlas, por eso se
  // tipa como `() => void` en la firma pública del puerto.
  configurarApiClient(() => estado, { alCerrarSesion: () => void limpiarCache() });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('apiFetch', () => {
  it('devuelve el cuerpo JSON en respuestas exitosas', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuestaJson({ ok: true }));
    await expect(apiFetch<{ ok: boolean }>('/prueba')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('devuelve undefined en 204', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiFetch<void>('/vacio')).resolves.toBeUndefined();
  });

  it('lanza ApiError con el contrato de error compartido', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respuestaJson(
        {
          statusCode: 404,
          code: 'NO_ENCONTRADO',
          message: 'Cliente no encontrado',
          requestId: '0f0c1f3e-1111-2222-3333-444455556666',
          timestamp: '2026-09-28T12:00:00.000Z',
          path: '/api/v1/clientes/x',
        },
        404,
      ),
    );

    await expect(apiFetch('/clientes/x')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NO_ENCONTRADO',
      message: 'Cliente no encontrado',
      path: '/api/v1/clientes/x',
    });
  });

  it('rellena los campos ausentes sin romper cuando el cuerpo no cumple el esquema', async () => {
    // Un 502 de Caddy o un proxy intermedio devuelve HTML: el error debe seguir
    // siendo utilizable por la SPA.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>502</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }),
    );

    const error = (await apiFetch('/error').catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('ERROR_DESCONOCIDO');
    expect(error.message).toBeTruthy();
  });

  it('el alias status sigue disponible para los lectores existentes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));
    const error = (await apiFetch('/error').catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(500);
    expect(error.statusCode).toBe(500);
  });

  it('envía el access token y las cookies en cada petición', async () => {
    estado.accessToken = 'token-1';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuestaJson({ ok: true }));

    await apiFetch('/prueba');

    const [, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(opciones.credentials).toBe('include');
    expect((opciones.headers as Record<string, string>).Authorization).toBe('Bearer token-1');
  });
});

describe('Renovación de sesión', () => {
  it('renueva el token y reintenta la petición original tras un 401', async () => {
    estado.accessToken = 'caducado';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(respuestaJson(respuestaLogin('token-2')))
      .mockResolvedValueOnce(respuestaJson({ ok: true }));

    await expect(apiFetch<{ ok: boolean }>('/pagos')).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(estado.establecerSesion).toHaveBeenCalledOnce();
    // El reintento usa ya el token nuevo.
    const [, opciones] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect((opciones.headers as Record<string, string>).Authorization).toBe('Bearer token-2');
  });

  it('deduplica refrescos concurrentes (single flight)', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(respuestaJson(respuestaLogin('token-2')));

    const [a, b] = await Promise.all([refrescarToken(), refrescarToken()]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(a).toBe('token-2');
    expect(b).toBe('token-2');
  });

  it('no intenta renovar la sesión cuando la petición era a /auth/refresh', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 401 }));

    await expect(apiFetch('/auth/refresh', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);

    // Un solo fetch: el 401 de /auth/refresh no dispara otro refresh.
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(estado.cerrarSesionLocal).not.toHaveBeenCalled();
  });

  it('cierra sesión y vacía la caché cuando la renovación falla', async () => {
    estado.accessToken = 'caducado';
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(apiFetch('/pagos')).rejects.toBeInstanceOf(ApiError);

    expect(estado.cerrarSesionLocal).toHaveBeenCalledOnce();
    // La caché se vacía para que el siguiente usuario no vea datos del anterior.
    expect(limpiarCache).toHaveBeenCalledOnce();
  });

  it('no cierra sesión si otro proceso renovó el token mientras esperábamos', async () => {
    estado.accessToken = 'caducado';
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockImplementationOnce(async () => {
        // Simula otra pestaña que rotó el refresh token primero.
        estado.accessToken = 'token-de-otra-pestana';
        return respuestaJson(respuestaLogin('token-de-otra-pestana'));
      })
      .mockResolvedValueOnce(respuestaJson({ ok: true }));

    await expect(apiFetch<{ ok: boolean }>('/pagos')).resolves.toEqual({ ok: true });

    expect(estado.cerrarSesionLocal).not.toHaveBeenCalled();
    expect(limpiarCache).not.toHaveBeenCalled();
  });

  it('devuelve null si la renovación no obtiene sesión (401 en /auth/refresh)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }));
    await expect(refrescarToken()).resolves.toBeNull();
  });
});
