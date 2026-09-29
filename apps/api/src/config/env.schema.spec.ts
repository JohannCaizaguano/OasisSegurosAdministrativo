import { validateEnv, validateWorkerEnv } from './env.schema';

const CLAVE_PRIVADA = `0x${'a'.repeat(64)}`;

const ENTORNO_VALIDO = {
  DATABASE_URL: 'postgresql://oasis:oasis@localhost:5432/oasis?schema=public',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('Validación del entorno con Zod', () => {
  it('acepta un entorno válido y aplica los valores por defecto', () => {
    const entorno = validateEnv(ENTORNO_VALIDO);

    expect(entorno.NODE_ENV).toBe('development');
    expect(entorno.PORT).toBe(3000);
    expect(entorno.LOG_LEVEL).toBe('info');
    expect(entorno.LOG_PRETTY).toBe(false);
    expect(entorno.CORS_ORIGIN).toBe('http://localhost:5173');
    expect(entorno.REDIS_HOST).toBe('localhost');
  });

  it('rechaza un entorno con variables faltantes y las lista todas juntas', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
    try {
      validateEnv({});
      fail('debió lanzar un error');
    } catch (error) {
      const mensaje = (error as Error).message;
      // No se detiene en la primera: informa todas las variables con problema.
      expect(mensaje).toMatch(/DATABASE_URL/);
      expect(mensaje).toMatch(/JWT_ACCESS_SECRET/);
      expect(mensaje).toMatch(/JWT_REFRESH_SECRET/);
    }
  });

  it('rechaza variables inválidas con un mensaje por variable', () => {
    expect(() =>
      validateEnv({
        ...ENTORNO_VALIDO,
        PORT: 'no-es-un-puerto',
        NODE_ENV: 'staging',
        LOG_LEVEL: 'verboso',
        LOG_PRETTY: 'si',
      }),
    ).toThrow(/PORT/);

    try {
      validateEnv({
        ...ENTORNO_VALIDO,
        PORT: 'no-es-un-puerto',
        NODE_ENV: 'staging',
        LOG_LEVEL: 'verboso',
      });
      fail('debió lanzar un error');
    } catch (error) {
      const mensaje = (error as Error).message;
      expect(mensaje).toMatch(/PORT/);
      expect(mensaje).toMatch(/NODE_ENV/);
      expect(mensaje).toMatch(/LOG_LEVEL/);
    }
  });

  it('exige la clave operadora solo en el entorno del worker', () => {
    // El API no conoce OPERATOR_PRIVATE_KEY (ADR-006): su esquema la ignora.
    expect(validateEnv(ENTORNO_VALIDO)).not.toHaveProperty('OPERATOR_PRIVATE_KEY');

    // El worker la exige y valida su formato.
    expect(() => validateWorkerEnv(ENTORNO_VALIDO)).toThrow(/OPERATOR_PRIVATE_KEY/);

    expect(() => validateWorkerEnv({ ...ENTORNO_VALIDO, OPERATOR_PRIVATE_KEY: '0x1234' })).toThrow(
      /OPERATOR_PRIVATE_KEY/,
    );

    expect(
      validateWorkerEnv({ ...ENTORNO_VALIDO, OPERATOR_PRIVATE_KEY: CLAVE_PRIVADA })
        .OPERATOR_PRIVATE_KEY,
    ).toBe(CLAVE_PRIVADA);
  });
});
