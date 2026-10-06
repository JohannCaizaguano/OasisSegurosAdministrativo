# ADR-011 · Alcance mínimo de compose.dev.yaml en el Sprint 1

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

La Definición de Terminado exige que cada historia "funcione en el entorno de desarrollo
con Docker Compose", pero el Sprint 1 solo compromete HT-01 (monorepo y CI) y HT-03 (base
del backend: migración, seed y `GET /health` contra PostgreSQL y Redis). La
contenerización completa (imágenes de producción, compose.prod, Caddy) es HT-05 (S12) y el
nodo Hardhat se necesita desde HT-02 (S2). Adelantarlos duplicaría trabajo de HT-05 sin
cubrir ningún criterio de aceptación del sprint.

## Decisión

`compose.dev.yaml` levanta solo los servicios de datos:

- `postgres:17-alpine` con volumen con nombre y healthcheck.
- `redis:7-alpine` con `--appendonly yes` (AOF), volumen con nombre y healthcheck.
- Puertos publicados solo en `127.0.0.1`.
- La aplicación (API y worker) corre en el host con `pnpm dev` apuntando a esos servicios.

El nodo Hardhat se agrega en S2 y las imágenes de `api` y `web` en S12.

## Alternativas descartadas

- **Adelantar compose.prod completo en S1**: invade HT-05, mezcla alcances y obliga a
  mantener dos configuraciones de contenedores a la vez.
- **No usar Docker en S1**: incumple la Definición de Terminado.

## Consecuencias

- Positivas: entorno mínimo suficiente para migrar, sembrar y probar `/health`; los
  puertos en loopback no exponen la base ni Redis a la red local.
- Negativas: hasta S12 la aplicación corre en el host con `pnpm dev`.
