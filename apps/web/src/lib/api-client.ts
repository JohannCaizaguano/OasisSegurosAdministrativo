import type { LoginResponse } from '@oasis/shared';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Sesion = {
  accessToken: string | null;
  establecerSesion: (respuesta: LoginResponse) => void;
  cerrarSesionLocal: () => void;
};

let obtenerStore: (() => Sesion) | null = null;

/** Inyección tardía del store para evitar ciclos de importación con zustand. */
export function configurarApiClient(store: () => Sesion): void {
  obtenerStore = store;
}

let refrescoEnCurso: Promise<boolean> | null = null;

async function refrescarToken(): Promise<boolean> {
  if (!refrescoEnCurso) {
    refrescoEnCurso = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          return false;
        }
        const datos = (await respuesta.json()) as LoginResponse;
        obtenerStore?.().establecerSesion(datos);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refrescoEnCurso = null;
      });
  }
  return refrescoEnCurso;
}

interface OpcionesPeticion extends RequestInit {
  /** true si el llamador no quiere reintento automático tras refrescar. */
  sinReintento?: boolean;
}

export async function apiFetch<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const store = obtenerStore?.();
  const { sinReintento = false, headers, ...resto } = opciones;

  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...resto,
    credentials: 'include',
    headers: {
      ...(resto.body ? { 'Content-Type': 'application/json' } : {}),
      ...(store?.accessToken ? { Authorization: `Bearer ${store.accessToken}` } : {}),
      ...headers,
    },
  });

  if (respuesta.status === 401 && !sinReintento && !ruta.startsWith('/auth/login')) {
    const refrescado = await refrescarToken();
    if (refrescado) {
      return apiFetch<T>(ruta, { ...opciones, sinReintento: true });
    }
    store?.cerrarSesionLocal();
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as {
    code?: string;
    message?: string;
    details?: unknown;
  } | null;

  if (!respuesta.ok) {
    throw new ApiError(
      respuesta.status,
      cuerpo?.code ?? 'ERROR_DESCONOCIDO',
      cuerpo?.message ?? 'No fue posible completar la operación',
      cuerpo?.details,
    );
  }

  return cuerpo as T;
}

export const api = {
  get: <T>(ruta: string) => apiFetch<T>(ruta),
  post: <T>(ruta: string, cuerpo?: unknown) =>
    apiFetch<T>(ruta, {
      method: 'POST',
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    }),
  patch: <T>(ruta: string, cuerpo?: unknown) =>
    apiFetch<T>(ruta, {
      method: 'PATCH',
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    }),
  delete: <T>(ruta: string) => apiFetch<T>(ruta, { method: 'DELETE' }),
};
