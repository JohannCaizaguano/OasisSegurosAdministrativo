# ADR-009 · Caddy sirviendo SPA y API en el mismo origen

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

El refresh token se entrega en una cookie `httpOnly`. Las cookies con `SameSite=Strict`
no viajan entre sitios distintos. Si el API y la SPA viven en orígenes diferentes, hay
que habilitar CORS con credenciales y relajar `SameSite`, aumentando el riesgo CSRF y la
complejidad de configuración.

## Decisión

Un solo contenedor `web` (Caddy 2) que:

- sirve la SPA estática desde `/srv` con `try_files {path} /index.html`;
- redirige `/api/*` a `api:3000` (`reverse_proxy`);
- obtiene el certificado TLS automáticamente para `{$DOMAIN}`;
- aplica cabeceras de seguridad (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, CSP);
- responde 404 a `/metrics` (solo accesible en la red interna desde Prometheus);
- usa `encode zstd gzip`.

Consecuencia directa: **no hay CORS en producción**. En desarrollo, Vite aplica el mismo
esquema (proxy `/api` → `localhost:3000`) y CORS se habilita únicamente en el API cuando
`NODE_ENV != production`.

## Alternativas descartadas

- **Nginx**: válido, pero Caddy resuelve TLS y configuración con mucho menos YAML/conf.
- **API y SPA en orígenes separados (CORS + SameSite=None)**: más superficie CSRF,
  cookies menos estrictas y configuración duplicada de dominios.
- **Servir la SPA desde el propio NestJS**: mezcla responsabilidades y complica el
  caching y el despliegue independiente de la SPA.

## Consecuencias

- Positivas: cookies estrictas sin CORS; TLS automático; cabeceras en un solo lugar;
  `/metrics` nunca se publica.
- Negativas: Caddy es un punto único de entrada (reinicio afecta la SPA y el API a la
  vez); requiere un DNS correcto para el certificado.
