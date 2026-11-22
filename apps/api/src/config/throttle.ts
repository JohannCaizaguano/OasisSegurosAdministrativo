import { validateEnv } from './env.schema';

type Limites = {
  global: number;
  login: number;
  refresh: number;
};

let cache: Limites | null = null;

/**
 * HU-28 (D4): consultas de verificación por usuario y minuto.
 * ponytail: techo, contadores en memoria de una sola instancia del API; salida, storage de Redis
 * en HT-08 (S8).
 */
export const LIMITE_VERIFICACION = { limite: 30, ventanaMs: 60_000 } as const;

/**
 * Límites del rate limiter para `@Throttle`, que se evalúa antes de que exista
 * el contenedor de DI: lee el mismo `envSchema` del arranque y los cachea.
 * Subirlos durante la medición de carga es deliberado (docs/despliegue.md).
 */
export function limitesThrottle(): Limites {
  if (cache) {
    return cache;
  }
  const valores = validateEnv(process.env);
  cache = {
    global: valores.THROTTLE_GLOBAL_LIMIT,
    login: valores.THROTTLE_LOGIN_LIMIT,
    refresh: valores.THROTTLE_REFRESH_LIMIT,
  };
  return cache;
}
