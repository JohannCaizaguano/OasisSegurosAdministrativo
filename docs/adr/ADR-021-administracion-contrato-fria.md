# ADR-021 · Administración del contrato con billetera fría

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S4

## Contexto

HT-15 exige que `DEFAULT_ADMIN_ROLE` de `RegistroRecibos` pertenezca a una cuenta distinta de la
operadora y que no resida en el servidor. Hoy el administrador es la cuenta que desplegó el
contrato. El contrato es inmutable (ADR-008), así que la separación se hace con roles, no
redesplegando.

## Decisión

- **Billetera fría.** El administrador es una cuenta que nunca toca el servidor (MetaMask en un
  equipo del autor o una billetera de hardware). El script `transferir-admin.ts` otorga
  `DEFAULT_ADMIN_ROLE` a esa cuenta, comprueba que lo tiene y renuncia el rol del desplegador.
- **Operadora con un solo rol.** La cuenta del worker solo tiene `REGISTRADOR_ROLE` (registrar y
  anular); no puede pausar, otorgar ni revocar roles.
- **Rotación.** `rotar-operadora.ts` otorga `REGISTRADOR_ROLE` a la cuenta nueva, lo revoca a la
  anterior y, con `--pausar`, pausa el registro ante una filtración. El procedimiento se prueba en
  el nodo local y se documenta en `docs/despliegue.md`; en Amoy lo ejecuta el autor.

## Alternativas descartadas

- **Safe multifirma 2 de 2:** con un solo firmante real (el autor) no agrega seguridad y complica
  la operación.
- **Mantener al desplegador como administrador:** su clave estuvo en el equipo de despliegue y no
  cumple el criterio de HT-15.

## Consecuencias

- Positivas: el robo de la clave del servidor permite registrar o anular recibos, pero no tomar el
  contrato ni quitar la pausa; la respuesta a un incidente es rotar y pausar.
- Negativas: pausar, reanudar o rotar exige acceso a la billetera fría del autor; si se pierde, el
  contrato queda sin administrador (se documenta su respaldo en el plan de incidentes).
