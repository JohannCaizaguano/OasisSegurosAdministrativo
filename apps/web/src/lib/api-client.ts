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

export type Sesion = {
  accessToken: string | null;
  establecerSesion: (respuesta: LoginResponse) => void;
  cerrarSesionLocal: () => void;
};

let obtenerStore: (() => Sesion) | null = null;
let limpiarCache: (() => void) | null = null;

/**
 * Inyección tardía del store para evitar ciclos de importación con zustand.
 * `alCerrarSesion` permite vaciar la caché de TanStack Query cuando la sesión
 * se cierra sola: sin esto, el siguiente usuario que entre en la misma pestaña
 * vería los datos cacheados del anterior (las claves de consulta no incluyen
 * el usuario).
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
 * Rota el refresh token. Devuelve el nuevo access token, o null si no hay sesión.
 *
 * Todas las llamadas comparten una única promesa ("single flight"): el refresh
 * token es de un solo uso y el API detecta su reutilización, así que dos
 * refrescos concurrentes con la misma cookie no serían dos sesiones válidas
 * sino una señal de robo que el servidor responde revocando todos los tokens.
 *
 * Se exporta para que la restauración inicial de sesión la reutilice y no
 * dispare una segunda rotación. Devolver el `accessToken` permite a la SPA
 * distinguir "mi token caducó" de "otro proceso ya lo renovó", y así no cerrar
 * sesión por error ante un 401 rezagado.
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
 * Rutas de autenticación: un 401 aquí significa "no hay sesión", no "token
 * caducado". Intentar refrescar en respuesta a un 401 de `/auth/refresh`
 * provocaba una recursión y dos llamadas por carga de página (el rate limit de
 * refresh es de 20/min).
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
    // Solo se cierra la sesión si el token realmente caducó. Si otro proceso
    // ya lo renovó mientras esperábamos (p. ej. dos pestañas), este 401 es
    // rezagado y cerrar sesión expulsaría al usuario con una sesión válida.
    if (store?.accessToken !== tokenAnterior) {
      return apiFetch<T>(ruta, { ...opciones, sinReintento: true });
    }
    store?.cerrarSesionLocal();
    limpiarCache?.();
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
