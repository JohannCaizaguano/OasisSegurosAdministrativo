# ADR-012 · /health con Terminus, dentro del prefijo /api/v1 y sin filtrar detalles

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

HT-03 exige que `GET /health` informe PostgreSQL y Redis (200 cuando ambos responden;
503 con el detalle por componente cuando alguno falla), sin autenticación y sin exponer
datos sensibles. En S1 no hay autenticación y Caddy enruta `/api/*` al backend (ADR-009).

## Decisión

- Usar **`@nestjs/terminus`** (`HealthCheckService` + dos indicadores propios sobre
  `PrismaService.$queryRaw` e `ioredis.ping`) en lugar de reinventar el contrato de
  respuesta: Terminus ya devuelve `status: "ok"` con 200 y 503 con detalle por componente.
- Ruta **`/api/v1/health`**, dentro del prefijo global, para viajar por el mismo camino
  que el resto del API (Caddy proxy `/api`) sin rutas exentas. Si algún día se necesita
  una sonda sin prefijo, se excluye del prefijo y se documenta aquí.
- Endpoint público (`@Public()`): una sonda de infraestructura no depende de credenciales
  y la respuesta solo indica arriba/abajo por componente (y el mensaje de error en fallo),
  **sin cadenas de conexión, versiones ni rutas del sistema**.

## Alternativas descartadas

- **Indicadores propios sin Terminus**: menos dependencias, pero habría que diseñar y
  probar a mano el formato de respuesta y el 503; Terminus ya lo resuelve dentro del
  ecosistema Nest.
- **`/health` fuera del prefijo global**: obliga a excepciones en `setGlobalPrefix` y en
  Caddy; la arquitectura no lo pide.

## Consecuencias

- Positivas: contrato estándar y probado; el monitoreo apunta a
  `http://api:3000/api/v1/health`; la respuesta no filtra información interna.
- Negativas: una dependencia más; el detalle del fallo incluye el mensaje del driver,
  aceptable porque el endpoint no publica configuración.
