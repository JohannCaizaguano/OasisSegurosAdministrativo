import { z } from 'zod';

const urlOpcional = z.preprocess(
  (valor) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor),
  z.url('Debe ser una URL válida').optional(),
);

const direccionOpcional = z.preprocess(
  (valor) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor),
  z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Debe ser una dirección Ethereum (0x + 40 hex)')
    .optional(),
);

/** Acepta solo "true"/"false" (evita el `z.coerce.boolean()` que convierte "false" en true). */
const booleano = z
  .enum(['true', 'false'])
  .default('false')
  .transform((valor) => valor === 'true');

/**
 * Esquema de entorno del API. Nótese que NO incluye OPERATOR_PRIVATE_KEY:
 * la clave privada operadora solo existe en el proceso worker.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // Logs: JSON siempre; la salida legible es una opción explícita de desarrollo.
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: booleano,

  // Identidad y puerto del exporter de métricas (lo usa sobre todo el worker).
  METRICS_APP: z.string().min(1).default('oasis-api'),
  WORKER_METRICS_PORT: z.coerce.number().int().min(1).max(65535).default(9101),

  // Orígenes permitidos para el SPA en desarrollo (lista separada por comas).
  // En producción Caddy sirve SPA y API en el mismo origen (ADR-009) y CORS no aplica.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),

  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL: z.string().min(2).default('15m'),
  JWT_REFRESH_TTL: z.string().min(2).default('7d'),

  CHAIN_ID: z.coerce.number().int().positive().default(31337),
  RPC_URL: z.url('RPC_URL inválida').default('http://127.0.0.1:8545'),
  RPC_URL_FALLBACK: urlOpcional,
  CONTRACT_ADDRESS: direccionOpcional,
  MAX_FEE_PER_GAS_GWEI: z.coerce.number().positive().default(50),
  EXPLORER_BASE_URL: z.url('EXPLORER_BASE_URL inválida').default('https://amoy.polygonscan.com'),

  DOMAIN: z.string().min(1).default('localhost'),

  /**
   * Límites del rate limiter (peticiones por minuto y por IP). Son configurables
   * porque los valores por defecto son de seguridad (5/min en login protege
   * contra fuerza bruta) y no de rendimiento: con ellos, una prueba de carga de
   * `POST /auth/login` mediría el throttler y no el API. Durante la evaluación
   * se suben y se documenta el valor usado (ver docs/despliegue.md).
   */
  THROTTLE_GLOBAL_LIMIT: z.coerce.number().int().positive().default(100),
  THROTTLE_LOGIN_LIMIT: z.coerce.number().int().positive().default(5),
  THROTTLE_REFRESH_LIMIT: z.coerce.number().int().positive().default(20),
  THROTTLE_VERIFICACION_PUBLICA_LIMIT: z.coerce.number().int().positive().default(20),
});

export type Env = z.infer<typeof envSchema>;

/** Entorno del worker: agrega la clave de firma custodial. */
export const workerEnvSchema = envSchema.extend({
  OPERATOR_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'OPERATOR_PRIVATE_KEY debe ser una clave privada de 32 bytes'),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

function formatearErrores(error: z.ZodError): string {
  const lineas = error.issues.map(
    (issue) => `  - ${issue.path.join('.') || '(raíz)'}: ${issue.message}`,
  );
  return lineas.join('\n');
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const resultado = envSchema.safeParse(raw);
  if (!resultado.success) {
    throw new Error(`Configuración de entorno inválida:\n${formatearErrores(resultado.error)}`);
  }
  return resultado.data;
}

export function validateWorkerEnv(raw: Record<string, unknown>): WorkerEnv {
  const resultado = workerEnvSchema.safeParse(raw);
  if (!resultado.success) {
    throw new Error(
      `Configuración de entorno del worker inválida:\n${formatearErrores(resultado.error)}`,
    );
  }
  return resultado.data;
}

/**
 * Lee y valida la clave de la cuenta operadora. Vive en la capa de
 * configuración porque el esquema del API no la conoce (ADR-006): solo el
 * proceso worker puede invocarla.
 */
export function claveOperadoraDelEntorno(
  raw: Record<string, unknown> = process.env,
): `0x${string}` {
  const parseo = workerEnvSchema.shape.OPERATOR_PRIVATE_KEY.safeParse(raw.OPERATOR_PRIVATE_KEY);
  if (!parseo.success) {
    throw new Error(
      'OPERATOR_PRIVATE_KEY ausente o inválida. Solo el proceso worker debe configurarla.',
    );
  }
  return parseo.data as `0x${string}`;
}
