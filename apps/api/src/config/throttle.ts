import { validateEnv } from './env.schema';

type Limites = {
  global: number;
  login: number;
  refresh: number;
  verificacionPublica: number;
};

let cache: Limites | null = null;

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
    verificacionPublica: valores.THROTTLE_VERIFICACION_PUBLICA_LIMIT,
  };
  return cache;
}
