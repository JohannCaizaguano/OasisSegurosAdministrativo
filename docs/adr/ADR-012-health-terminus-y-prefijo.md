# ADR-012 · /health con Terminus, dentro del prefijo /api/v1 y sin filtrar detalles

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

HT-03 exige que `GET /health` informe PostgreSQL y Redis (200 cuando ambos responden;
503 con el detalle por componente cuando alguno falla), sin autenticación y sin exponer
datos sensibles. En S1 no hay autenticación y Caddy enruta `/api/*` al backend (ADR-009).

## Decisión

- `@nestjs/terminus`: `HealthCheckService` con dos indicadores propios, sobre
  `PrismaService.$queryRaw` e `ioredis.ping`. Terminus ya responde `status: "ok"` con 200, y 503
  con el detalle por componente.
- Ruta `/api/v1/health`, dentro del prefijo global: pasa por el mismo proxy de Caddy que el
  resto del API, sin rutas exentas.
- Endpoint público (`@Public()`): una sonda de infraestructura no usa credenciales. La
  respuesta solo dice si cada componente está arriba o abajo y, si falla, el mensaje de error;
  nunca cadenas de conexión, versiones ni rutas del sistema.

## Alternativas descartadas

- **Indicadores propios sin Terminus**: una dependencia menos, pero habría que diseñar y
  probar a mano el formato de respuesta y el 503.
- **`/health` fuera del prefijo global**: obliga a excepciones en `setGlobalPrefix` y en
  Caddy; la arquitectura no lo pide.

## Consecuencias

- Positivas: formato de respuesta estándar; el monitoreo apunta a
  `http://api:3000/api/v1/health`; la respuesta no filtra información interna.
- Negativas: una dependencia más; el detalle del fallo incluye el mensaje del driver,
  aceptable porque el endpoint no publica configuración.
