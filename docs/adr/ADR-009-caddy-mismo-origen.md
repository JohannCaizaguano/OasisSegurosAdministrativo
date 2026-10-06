# ADR-009 · Caddy sirviendo SPA y API en el mismo origen

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

El refresh token se entrega en una cookie `httpOnly` con `SameSite=Strict`, que no viaja
entre orígenes distintos. Si la SPA y el API vivieran en orígenes separados habría que
habilitar CORS con credenciales y relajar `SameSite`, con más riesgo de CSRF y más
configuración.

## Decisión

Un solo contenedor `web` (Caddy 2) que:

- sirve la SPA estática desde `/srv` con `try_files {path} /index.html`;
- redirige `/api/*` a `api:3000` (`reverse_proxy`);
- obtiene el certificado TLS automáticamente para `{$DOMAIN}`;
- aplica cabeceras de seguridad (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, CSP);
- responde 404 a `/metrics` (solo accesible desde Prometheus en la red interna);
- usa `encode zstd gzip`.

En producción no hay CORS. En desarrollo, Vite hace lo mismo (proxy de `/api` a
`localhost:3000`) y el API solo habilita CORS cuando `NODE_ENV` no es `production`.

## Alternativas descartadas

- **Nginx**: válido, pero Caddy obtiene el certificado TLS solo y su configuración es más corta.
- **Orígenes separados (CORS + SameSite=None)**: más superficie CSRF, cookies menos
  estrictas y configuración duplicada de dominios.
- **Servir la SPA desde NestJS**: mezcla responsabilidades y complica caching y despliegue
  independiente de la SPA.

## Consecuencias

- Positivas: cookies estrictas sin CORS; TLS automático; cabeceras en un solo lugar;
  `/metrics` nunca se publica.
- Negativas: Caddy es un punto único de entrada (su reinicio afecta SPA y API); requiere
  DNS correcto para el certificado.
