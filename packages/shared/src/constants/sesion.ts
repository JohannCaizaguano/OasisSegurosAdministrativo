/** Cierre por inactividad (HU-32, ADR-016): la SPA y el API usan los mismos valores. */
export const INACTIVIDAD_SESION_MS = 30 * 60_000;

/** Antelación del aviso con opción de continuar. */
export const AVISO_INACTIVIDAD_MS = 60_000;

/** Intervalo mínimo entre latidos de la SPA mientras hay actividad sin peticiones. */
export const LATIDO_SESION_MS = 60_000;

/** El servidor espera un latido más que la SPA, para no cerrar nunca antes que ella. */
export const TTL_SESION_SEGUNDOS = (INACTIVIDAD_SESION_MS + LATIDO_SESION_MS) / 1_000;
