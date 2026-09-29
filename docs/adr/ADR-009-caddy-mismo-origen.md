# ADR-009 · Caddy sirviendo SPA y API en el mismo origen

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

El refresh token se entrega en una cookie `httpOnly` con `SameSite=Strict`, que no viaja
entre orígenes distintos. Si la SPA y el API vivieran en orígenes separados habría que
habilitar CORS con credenciales y relajar `SameSite`, aumentando el riesgo CSRF y la
complejidad de configuración.

## Decisión

Un solo contenedor `web` (Caddy 2) que:

- sirve la SPA estática desde `/srv` con `try_files {path} /index.html`;
- redirige `/api/*` a `api:3000` (`reverse_proxy`);
- obtiene el certificado TLS automáticamente para `{$DOMAIN}`;
- aplica cabeceras de seguridad (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, CSP);
- responde 404 a `/metrics` (solo accesible desde Prometheus en la red interna);
- usa `encode zstd gzip`.

Consecuencia directa: **no hay CORS en producción**. En desarrollo, Vite aplica el mismo
esquema (proxy `/api` → `localhost:3000`) y el API solo habilita CORS con
`NODE_ENV != production`.

## Alternativas descartadas

- **Nginx**: válido, pero Caddy resuelve TLS y configuración con mucho menos YAML/conf.
- **Orígenes separados (CORS + SameSite=None)**: más superficie CSRF, cookies menos
  estrictas y configuración duplicada de dominios.
- **Servir la SPA desde NestJS**: mezcla responsabilidades y complica caching y despliegue
  independiente de la SPA.

## Consecuencias

- Positivas: cookies estrictas sin CORS; TLS automático; cabeceras en un solo lugar;
  `/metrics` nunca se publica.
- Negativas: Caddy es un punto único de entrada (su reinicio afecta SPA y API); requiere
  DNS correcto para el certificado.
