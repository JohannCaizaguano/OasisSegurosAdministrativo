// Mínimos para las pruebas unitarias que importan controladores con `@Throttle`:
// `limitesThrottle()` valida el entorno al evaluar el decorador, antes de que
// exista el contenedor de DI. En CI los secretos vienen del workflow.
process.env.DATABASE_URL ??= 'postgresql://oasis:oasis@localhost:5432/oasis?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-test-access-secret-1234';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-test-refresh-secret-1234';
