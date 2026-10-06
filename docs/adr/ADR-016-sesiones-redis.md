# ADR-016 · Sesiones por familia de rotación con cierre por inactividad en Redis

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: 3

## Contexto

El almacén de refresh guardaba un solo `jti` por usuario y, ante un `jti` desconocido, revocaba
todo: si alguien iniciaba sesión en dos equipos, el refresco del primero cerraba la sesión del
segundo. HU-02 pide invalidar la sesión en el servidor, HU-06 cerrar las demás sesiones al cambiar
la contraseña y HU-32 cerrar tras 30 minutos sin actividad, también cuando la pestaña se cierra sin
salir y la cookie de 7 días sigue viva en un equipo compartido.

## Decisión

- Cada inicio de sesión abre una familia: `sesion:<usuarioId>:<sid>` en Redis guarda el `jti`
  vigente con un TTL de 31 minutos. Ambos tokens llevan el `sid`.
- `JwtEstrategia` hace `EXPIRE` en cada petición autenticada: comprueba que la sesión vive y desliza
  su TTL en una operación. Logout, cambio de contraseña e inactividad cierran la sesión al instante.
  Si Redis no responde en 2 s, la petición falla con 502.
- El refresco rota el `jti` con un script Lua atómico y conserva el vencimiento absoluto de la
  familia (7 días desde el inicio de sesión). Un `jti` que no es el vigente revoca esa familia.
- La SPA mide la inactividad por interacción en pantalla, compartida entre pestañas, avisa a los
  29 minutos y cierra a los 30. Mientras hay actividad envía como máximo un latido por minuto; por
  eso el servidor espera 31 minutos. Los valores están en `@oasis/shared`.

## Alternativas descartadas

- **Access token sin estado**: logout y cambio de contraseña tardarían hasta 15 minutos en surtir
  efecto, y la inactividad solo se comprobaría al refrescar.
- **Una sesión por usuario**: no habría "demás sesiones" que cerrar y, para que dos equipos no se
  tumbaran, habría que renunciar a la detección de reutilización.
- **Inactividad solo en la SPA**: una pestaña cerrada deja la cookie restaurando la sesión.

## Consecuencias

- Positivas: revocación inmediata, varias sesiones por usuario sin interferencias y un token robado
  no vive más de 7 días.
- Negativas: una operación de Redis por petición autenticada y Redis en el camino crítico del API.
  Las consultas automáticas mantienen viva la sesión en el servidor mientras la pestaña está
  abierta; en ese caso el cierre lo hace la SPA.
