# ADR-011 · Alcance mínimo de compose.dev.yaml en el Sprint 1

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

La Definición de Terminado del backlog exige que cada historia "funcione en el entorno
de desarrollo con Docker Compose". A la vez, el sprint 1 solo compromete HT-01
(monorepo y CI) y HT-03 (base del backend): migración, seed y `GET /health` contra
PostgreSQL y Redis.

La contenerización completa (imágenes de producción, compose.prod, Caddy) es **HT-05**
(S12) y el nodo local de Hardhat recién se necesita en **HT-02** (S2). Adelantar
contenedores de la aplicación en S1 duplicaría el trabajo de HT-05 sin aportar a los
criterios de aceptación.

## Decisión

`compose.dev.yaml` del Sprint 1 levanta **solo los servicios de datos**:

- `postgres:17-alpine` con volumen con nombre y healthcheck.
- `redis:7-alpine` con `--appendonly yes` (AOF), volumen con nombre y healthcheck.
- Puertos publicados **únicamente en `127.0.0.1`** (no en la red local).
- La aplicación (API y worker) corre en el host con `pnpm dev`, apuntando a esos
  servicios.

El nodo Hardhat y las imágenes de `api`/`web` se agregan en S2 y S12 respectivamente,
sin cambiar la decisión de fondo (los servicios de datos y su configuración no se
tocan).

## Alternativas descartadas

- **Adelantar compose.prod completo en S1**: invade HT-05, mezcla el alcance del sprint
  y obliga a mantener dos configuraciones de contenedores a la vez.
- **No usar Docker en S1**: incumple la Definición de Terminado.

## Consecuencias

- Positivas: entorno mínimo suficiente para migrar, sembrar y probar `/health`; los
  puertos en loopback evitan exponer la base de datos y Redis a la red local.
- Negativas: el desarrollador necesita `pnpm dev` para la aplicación hasta S12; el
  requisito de Docker ya queda satisfecho, así que la deuda es acotada y planificada.
