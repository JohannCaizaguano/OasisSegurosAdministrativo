# ADR-015 · Acceso al sistema solo con inicio de sesión; sin página pública de verificación

- **Estado**: aceptado (S3: regla de acceso; S8: verificación del cliente)
- **Fecha**: 2026-10
- **Sprint**: 3 y 8

## Contexto

El alcance inicial preveía que aseguradoras o terceros verificaran recibos en una página
pública, sin cuenta. Oasis Seguros definió que el sistema es solo para su personal y sus
clientes. El sitio web institucional, con su botón **Iniciar sesión**, es un proyecto aparte.
Las aseguradoras siguen existiendo como datos de las pólizas (HU-11).

## Decisión

- Todas las rutas de negocio exigen JWT. Sin JWT quedan solo el inicio de sesión, la renovación y
  el cierre de sesión (los dos últimos se autentican con la cookie de renovación), la recuperación
  de contraseña (HU-31) y las sondas de infraestructura `/health` y `/metrics`; esta última está
  fuera del prefijo y Caddy no la publica (ADR-009).
- La regla se hace cumplir en el código: `RolesGuard` niega toda ruta que no declare `@Roles`, una
  prueba fija la lista de rutas públicas y exige roles en las demás, y un e2e comprueba 401 y 403
  en todas las rutas.
- La verificación del recibo (HU-28; RF-33, RF-34) pasa a `GET /api/v1/recibos/:codigo/verificacion`.
  En S3 la usan ADMIN y OPERADOR; en S8 (HU-28) se abre al CLIENTE solo para sus recibos (RN-07): un
  recibo ajeno responde "No encontrado", y el límite es de 30 consultas por minuto por usuario
  (RNF-12).
- El QR del recibo apunta a `/recibos/verificar/:codigo` en la SPA, que pide iniciar sesión si no
  hay sesión activa.
- Se retiran `VerificacionPublicaController`, la ruta `public/`, `THROTTLE_VERIFICACION_PUBLICA_LIMIT`
  y el escenario k6 `verificacion-publica.js`, que se reemplaza por `verificacion-recibo.js`.

## Alternativas descartadas

- **Mantener la página pública**: amplía la superficie de ataque y sirve a un público que ya
  no está en el alcance.
- **Verificación pública con token firmado en el QR**: añade complejidad sin un usuario que la
  necesite.

## Consecuencias

- Positivas: menos superficie expuesta y una sola regla de acceso para todo el API.
- Negativas: un tercero ya no puede comprobar un recibo sin cuenta; si lo necesita, el cliente
  le muestra el resultado o el enlace a PolygonScan, que sigue siendo público. Entre S3 y S8 el
  CLIENTE no puede verificar recibos; no hay clientes reales hasta el despliegue (S13).
