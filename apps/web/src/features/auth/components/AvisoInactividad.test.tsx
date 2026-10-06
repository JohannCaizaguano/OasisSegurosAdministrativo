import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UsuarioSesion } from '@oasis/shared';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

import { useAuthStore } from '@/lib/auth-store';
import { apiFetch } from '@/lib/api-client';

import { AvisoInactividad } from './AvisoInactividad';

const USUARIO: UsuarioSesion = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'operador@oasis.com',
  rol: 'OPERADOR',
  nombre: 'Operador',
  clienteId: null,
};

const MINUTO = 60_000;

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let fetchMock: MockInstance;

async function avanzar(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function montar() {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={cliente}>
      <AvisoInactividad />
    </QueryClientProvider>,
  );
}

function llamadasARuta(fragmento: string): number {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes(fragmento)).length;
}

beforeEach(async () => {
  vi.useFakeTimers();
  localStorage.clear();
  useAuthStore.setState({
    accessToken: 'token',
    usuario: USUARIO,
    autenticado: true,
    motivoCierre: null,
  });
  fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    const ruta = String(url);
    if (ruta.includes('/auth/logout')) {
      return Promise.resolve(respuestaJson(null, 204));
    }
    if (ruta.includes('/auth/me')) {
      return Promise.resolve(respuestaJson(USUARIO));
    }
    return Promise.resolve(respuestaJson({}));
  });
  // El reloj falso arranca en otro instante que el real: sincroniza la marca que
  // usa el latido (`msDesdeUltimaPeticion`) con el reloj de las pruebas.
  await apiFetch('/reloj-de-prueba');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  useAuthStore.setState({
    accessToken: null,
    usuario: null,
    autenticado: false,
    motivoCierre: null,
  });
});

describe('AvisoInactividad', () => {
  it('avisa un minuto antes de los 30 minutos', async () => {
    montar();

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await avanzar(29 * MINUTO);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/se cerrará por inactividad en 60 s/)).toBeInTheDocument();
  });

  it('a los 30 minutos cierra la sesión por inactividad', async () => {
    montar();

    await avanzar(30 * MINUTO);

    expect(useAuthStore.getState().motivoCierre).toBe('inactividad');
    expect(useAuthStore.getState().autenticado).toBe(false);
    expect(localStorage.getItem('oasis:sesion-cerrada')).toMatch(/^inactividad:/);
  });

  it('Continuar reinicia el plazo y envía un latido', async () => {
    montar();
    await avanzar(29 * MINUTO);
    fetchMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(llamadasARuta('/auth/me')).toBe(1);

    await avanzar(2 * MINUTO);
    expect(useAuthStore.getState().motivoCierre).toBeNull();
    expect(llamadasARuta('/auth/logout')).toBe(0);
  });

  it('Cerrar sesión en el aviso no deja que el plazo dispare un segundo cierre', async () => {
    montar();
    await avanzar(29 * MINUTO + 59_000);
    let responderLogout: (respuesta: Response) => void = () => undefined;
    fetchMock.mockImplementation(
      () => new Promise<Response>((resolver) => (responderLogout = resolver)),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await avanzar(5_000);
    responderLogout(respuestaJson(null, 204));
    await avanzar(0);

    expect(llamadasARuta('/auth/logout')).toBe(1);
    expect(useAuthStore.getState().motivoCierre).toBeNull();
    expect(useAuthStore.getState().autenticado).toBe(false);
  });

  it('la actividad de otra pestaña pospone el cierre', async () => {
    montar();
    await avanzar(20 * MINUTO);
    localStorage.setItem('oasis:ultima-actividad', String(Date.now()));

    await avanzar(15 * MINUTO);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useAuthStore.getState().motivoCierre).toBeNull();
  });

  it('el cierre de otra pestaña cierra esta', async () => {
    montar();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'oasis:sesion-cerrada',
          newValue: `inactividad:${Date.now()}`,
        }),
      );
    });

    expect(useAuthStore.getState().motivoCierre).toBe('inactividad');
    expect(useAuthStore.getState().autenticado).toBe(false);
  });

  it('el latido sale como máximo una vez por minuto', async () => {
    montar();

    fireEvent.keyDown(window); // hace poco hubo petición: no toca latir
    await avanzar(70_000);
    fireEvent.keyDown(window); // primer latido
    await avanzar(30_000);
    fireEvent.keyDown(window); // menos de un minuto desde el anterior
    await avanzar(40_000);
    fireEvent.keyDown(window); // segundo latido

    expect(llamadasARuta('/auth/me')).toBe(2);
  });
});
