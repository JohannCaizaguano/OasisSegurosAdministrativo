import { describe, expect, it, vi, afterEach } from 'vitest';

import { ApiError, apiFetch } from './api-client';

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

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

  it('lanza ApiError con el código del backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respuestaJson({ code: 'NO_ENCONTRADO', message: 'Cliente no encontrado' }, 404),
    );

    await expect(apiFetch('/clientes/x')).rejects.toMatchObject({
      status: 404,
      code: 'NO_ENCONTRADO',
      message: 'Cliente no encontrado',
    });
  });

  it('ApiError conserva el status para el manejo de reintentos', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));
    const error = await apiFetch('/error').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });
});
