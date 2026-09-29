import { apiErrorSchema, type ApiError as CuerpoApiError, type LoginResponse } from '@oasis/shared';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/** Error de API validado con `apiErrorSchema` de `@oasis/shared`. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly path?: string;

  constructor(cuerpo: Partial<CuerpoApiError> & { message?: string }, status: number) {
    super(cuerpo.message ?? 'No fue posible completar la operación');
    this.name = 'ApiError';
    this.statusCode = cuerpo.statusCode ?? status;
    this.code = cuerpo.code ?? 'ERROR_DESCONOCIDO';
    this.details = cuerpo.details;
    this.requestId = cuerpo.requestId;
    this.path = cuerpo.path;
  }

  /** Alias para no romper los lectores que usaban la propiedad anterior. */
  get status(): number {
    return this.statusCode;
  }
}

export type Sesion = {
  accessToken: string | null;
  establecerSesion: (respuesta: LoginResponse) => void;
  cerrarSesionLocal: () => void;
};

let obtenerStore: (() => Sesion) | null = null;
let limpiarCache: (() => void) | null = null;

/**
 * Inyección tardía del store (evita ciclos con zustand); `alCerrarSesion` vacía
 * la caché cuando la sesión expira.
 */
export function configurarApiClient(
  store: () => Sesion,
  opciones: { alCerrarSesion?: () => void } = {},
): void {
  obtenerStore = store;
  limpiarCache = opciones.alCerrarSesion ?? null;
}

let refrescoEnCurso: Promise<string | null> | null = null;

/**
 * Rota el refresh token (single-flight: el token es de un solo uso y el API
 * detecta su reutilización). Devuelve el access token nuevo o null.
 */
export function refrescarToken(): Promise<string | null> {
  if (!refrescoEnCurso) {
    refrescoEnCurso = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          return null;
        }
        const datos = (await respuesta.json()) as LoginResponse;
        obtenerStore?.().establecerSesion(datos);
        return datos.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refrescoEnCurso = null;
      });
  }
  return refrescoEnCurso;
}

/**
 * Un 401 en rutas de auth significa "sin sesión", no "token caducado": no se
 * reintenta el refresco.
 */
function esRutaDeAuth(ruta: string): boolean {
  return /^\/auth\/(login|refresh|logout)/.test(ruta);
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

  if (respuesta.status === 401 && !sinReintento && !esRutaDeAuth(ruta)) {
    const tokenAnterior = store?.accessToken ?? null;
    const tokenNuevo = await refrescarToken();
    if (tokenNuevo) {
      return apiFetch<T>(ruta, { ...opciones, sinReintento: true });
    }
    // Solo se cierra sesión si el token no fue renovado por otro proceso
    // (p. ej. otra pestaña).
    if (store?.accessToken !== tokenAnterior) {
      return apiFetch<T>(ruta, { ...opciones, sinReintento: true });
    }
    store?.cerrarSesionLocal();
    limpiarCache?.();
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as CuerpoApiError | null;

  if (!respuesta.ok) {
    const validado = apiErrorSchema.safeParse(cuerpo);
    throw new ApiError(validado.success ? validado.data : (cuerpo ?? {}), respuesta.status);
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
