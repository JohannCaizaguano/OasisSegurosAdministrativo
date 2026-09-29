# ADR-012 · /health con Terminus, dentro del prefijo /api/v1 y sin filtrar detalles

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

HT-03 exige que `GET /health` informe el estado de PostgreSQL y Redis (200 cuando
ambos responden; 503 con el detalle por componente cuando alguno falla), sin
autenticación y sin exponer datos sensibles.

En S1 todavía no existe autenticación, Caddy es el único punto de entrada público y
enruta `/api/*` al backend (ADR-009). Había que decidir la librería del chequeo y la
ruta final del endpoint.

## Decisión

- Usar **`@nestjs/terminus`** (`HealthCheckService` + dos indicadores propios que
  consultan `PrismaService.$queryRaw` y `ioredis.ping`) en lugar de reinventar el
  contrato de respuesta: Terminus ya devuelve `status: "ok"` con 200 y 503 con el
  detalle por componente, y es parte del stack NestJS.
- La ruta es **`/api/v1/health`**, dentro del prefijo global, para que el chequeo
  viaje por el mismo camino que el resto del API (Caddy proxy `/api`), sin mantener
  una ruta exenta en el proxy. Si un día se necesita una sonda externa sin prefijo,
  se excluye del prefijo y se documenta aquí.
- El endpoint es público (`@Public()`) porque en S1 no hay autenticación y porque una
  sonda de infraestructura no debe depender de credenciales. La respuesta solo indica
  arriba/abajo por componente y, en caso de fallo, el mensaje del error: **no
  incluye cadenas de conexión, versiones ni rutas del sistema**.

## Alternativas descartadas

- **Indicadores propios sin Terminus**: menos dependencias, pero hay que diseñar y
  probar a mano el formato de respuesta y el código 503; Terminus ya lo resuelve y
  está mantenido dentro del ecosistema Nest.
- **`/health` fuera del prefijo global**: obliga a excepciones en `setGlobalPrefix` y
  en Caddy; la arquitectura no lo pide.

## Consecuencias

- Positivas: contrato estándar y probado; el monitoreo apunta a
  `http://api:3000/api/v1/health`; la respuesta no filtra información interna.
- Negativas: una dependencia más (`@nestjs/terminus`); el detalle del fallo incluye el
  mensaje del driver, aceptable porque el endpoint no publica configuración.
