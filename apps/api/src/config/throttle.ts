import { envSchema } from './env.schema';

type Limites = {
  global: number;
  login: number;
  refresh: number;
  verificacionPublica: number;
};

let cache: Limites | null = null;

/**
 * Límites del rate limiter leídos del entorno.
 *
 * `@Throttle` se evalúa como decorador, antes de que exista el contenedor de
 * inyección de dependencias, así que no puede leer `AppConfig`. Se usa el mismo
 * esquema Zod que valida el arranque (`envSchema`), de modo que los valores y
 * sus valores por defecto son los mismos, y se cachean tras la primera lectura.
 *
 * Subir estos valores durante la medición de carga es deliberado: con los
 * valores de seguridad (5/min en login) una prueba de carga mediría el
 * rate limiter en lugar del API. Ver docs/despliegue.md.
 */
export function limitesThrottle(): Limites {
  if (cache) {
    return cache;
  }
  const resultado = envSchema.safeParse(process.env);
  const valores = resultado.success ? resultado.data : envSchema.parse({ DATABASE_URL: 'x' });
  cache = {
    global: valores.THROTTLE_GLOBAL_LIMIT,
    login: valores.THROTTLE_LOGIN_LIMIT,
    refresh: valores.THROTTLE_REFRESH_LIMIT,
    verificacionPublica: valores.THROTTLE_VERIFICACION_PUBLICA_LIMIT,
  };
  return cache;
}
