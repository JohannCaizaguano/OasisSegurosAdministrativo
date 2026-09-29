# Sprint 1 — Monorepo, integración continua y backend base

- **Historias:** HT-01 (10 h) y HT-03 (12 h) — 22 de 25 horas de capacidad.
- **Épica:** EP-07 Plataforma e infraestructura.
- **Rama:** `feat/sprint-01-base-monorepo-backend` (sin publicar).
- **Fechas reales:** **\_ por completar _**
- **Estado:** criterios de aceptación completados; pendientes de la DoD que dependen de
  terceros (PR, CI en GitHub y aceptación del Product Owner).

> Verificación ejecutada el **29/09/2026** sobre la rama del sprint; reproducible con los
> comandos de la sección 10.

## 1. Objetivo

Monorepo pnpm con calidad automatizada y CI, y base del backend hexagonal: configuración
validada, Prisma 7 con adaptador `pg`, migración inicial, seed, `GET /health`, logs JSON
con `requestId`, filtro global de errores y regla de dependencias verificada.

## 2. Entregables

| Entregable                                                 | Ubicación                                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| Workspace pnpm con cuatro paquetes                         | `pnpm-workspace.yaml`, `apps/*`, `packages/*`                               |
| Calidad automatizada (ESLint, Prettier, husky, commitlint) | `eslint.config.mjs`, `.prettierrc.json`, `.husky/`, `commitlint.config.mjs` |
| Pipeline de integración continua                           | `.github/workflows/ci.yml`                                                  |
| Modelo de datos completo (§9.0) y migración inicial        | `apps/api/prisma/schema.prisma`, `prisma/migrations/20260929155339_init/`   |
| Seed idempotente con catálogos                             | `apps/api/prisma/seed.ts`                                                   |
| Configuración validada con Zod                             | `apps/api/src/config/`                                                      |
| `GET /health` (PostgreSQL y Redis)                         | `apps/api/src/infrastructure/health/`                                       |
| Logs JSON con `requestId`                                  | `apps/api/src/app.module.ts` (nestjs-pino)                                  |
| Filtro global de errores uniforme                          | `apps/api/src/common/filters/all-exceptions.filter.ts`                      |
| Regla hexagonal verificada en CI                           | `apps/api/.dependency-cruiser.cjs`, `pnpm deps:check`                       |
| Plantilla de módulos hexagonales                           | `apps/api/src/modules/README.md`                                            |
| Documentación del entorno                                  | `README.md`, `AGENTS.md`, `docs/adr/`, `docs/referencia/`                   |

## 3. Criterios de aceptación — HT-01

| #   | Criterio                                                                               | Evidencia                                                                                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El workspace contiene `apps/api`, `apps/web`, `packages/contracts` y `packages/shared` | `pnpm-workspace.yaml` (globs `apps/*`, `packages/*`) y los cuatro `package.json`; `pnpm -r build` compila los 4.                                                                                                                                                                      |
| 2   | ESLint, Prettier, husky, lint-staged y commitlint funcionan en cada commit             | `.lintstagedrc.json` + hooks `pre-commit` (lint-staged) y `commit-msg` (commitlint). En esta rama commitlint rechazó un commit sin tipo/scope y el scope no permitido `adr`; los 20 siguientes pasaron.                                                                               |
| 3   | `ci.yml` instala dependencias, ejecuta lint y construye en cada push y pull request    | `ci.yml`: `push` (main) y `pull_request`; `pnpm install --frozen-lockfile`, `lint`, `format:check`, `typecheck`, `deps:check`, `build`; jobs de contratos, API (Postgres 17 + Redis 7, `migrate deploy` y e2e), SPA e imágenes Docker; `permissions: contents: read` y `concurrency`. |
| 4   | El README describe cómo levantar el entorno local                                      | `README.md`: requisitos, instalación, `.env`, compose, migración, seed, `pnpm dev`, `/health`, pruebas y scripts.                                                                                                                                                                     |

## 4. Criterios de aceptación — HT-03

| #   | Criterio                                                                        | Evidencia                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Las variables de entorno se validan con Zod y el API no arranca si falta alguna | `src/config/env.schema.ts` (esquema único; el error lista **todas** las variables con problema) y `env.schema.spec.ts` (3 casos). Sin `DATABASE_URL` el proceso termina con código 1 y la variable señalada; con tres valores inválidos los lista los tres.                                                                 |
| 2   | Prisma 7 con adaptador `pg`, migración inicial y seed                           | `prisma@7.10.0` + `@prisma/adapter-pg@7.10.0` (`prisma.config.ts`, `PrismaService`). `migrate deploy` aplica `20260929155339_init` (12 tablas, enums, únicos e índices) desde cero; el seed corre dos veces sin error y en producción se niega a usar la contraseña por defecto.                                            |
| 3   | `GET /health` informa PostgreSQL y Redis                                        | `GET /api/v1/health` → `200 {"status":"ok","info":{"database":{"status":"up"},"redis":{"status":"up"}}}`; con Redis detenido → `503` con el detalle y vuelve a 200 al reiniciarlo. Pruebas unitarias de los indicadores y e2e de 200/503.                                                                                   |
| 4   | Los logs son JSON e incluyen `requestId` por solicitud                          | `nestjs-pino` con JSON en todos los entornos (`LOG_PRETTY=true` solo con `pnpm dev:pretty`); `redact` de `authorization`, `cookie` y `set-cookie`; `genReqId` reutiliza `x-request-id` solo si es UUID válido. e2e: cabecera presente, valor entrante conservado, no-UUID descartado y `requestId` en el cuerpo de errores. |
| 5   | Un filtro global devuelve los errores en formato uniforme                       | `all-exceptions.filter.ts` con `statusCode`, `code`, `message`, `details`, `requestId`, `timestamp` y `path`; `DomainError` → HTTP (400/401/403/404/409/422/502), `HttpException` y `ZodError` con el mismo formato; error inesperado → 500 genérico sin stack (el detalle queda en el log). 9 unitarias + e2e de 404.      |
| 6   | dependency-cruiser falla si el dominio importa infraestructura                  | `pnpm deps:check` → 0 violaciones (169 módulos). `pnpm deps:check:negativo` crea un `domain/` que importa `infrastructure/`, confirma que `deps:check` falla (`error domain-sin-otras-capas`) y lo elimina.                                                                                                                 |

## 5. Definición de Terminado (§2.3 del backlog)

| Ítem                                                        | Estado | Nota                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cumple todos sus criterios de aceptación                    | ✅     | Secciones 3 y 4.                                                                                                                                                                                                                                                                                      |
| Pruebas automatizadas y CI en verde                         | ✅     | 117 pruebas (58 API, 33 SPA, 26 contratos) + 10 e2e del API. **CI en el PR [#1](https://github.com/JohannCaizaguano/OasisSegurosAdministrativo/pull/1)**: 5 de 6 jobs en verde. **Slither** falla y queda como deuda de HT-02 (S2): `crytic-compile` no resuelve los tests Foundry de los artefactos. |
| Código integrado en la rama principal mediante pull request | ⏳     | PR [#1](https://github.com/JohannCaizaguano/OasisSegurosAdministrativo/pull/1) abierto contra `main`; pendiente revisión y merge.                                                                                                                                                                     |
| Funciona en el entorno de desarrollo con Docker Compose     | ✅     | `compose.dev.yaml` (PostgreSQL 17 + Redis 7): migración desde cero, seed, `/health` y e2e ejecutados contra esos contenedores.                                                                                                                                                                        |
| Documentación afectada actualizada                          | ✅     | `README.md`, `AGENTS.md`, `docs/adr/` (ADR-001, 002, 010, 011, 012), `docs/arquitectura/` y este informe.                                                                                                                                                                                             |
| El Product Owner la aceptó en la revisión del sprint        | ⏳     | Pendiente de la revisión semanal.                                                                                                                                                                                                                                                                     |

## 6. Versiones exactas

| Componente                       | Versión                                                                    |
| -------------------------------- | -------------------------------------------------------------------------- |
| Node.js                          | 24 LTS objetivo (`.nvmrc`, `engines >=24 <27`); la verificación usó 26.7.0 |
| pnpm                             | 12.3.4 (`packageManager`)                                                  |
| NestJS                           | 11.2.6 (no 12: ESM-only)                                                   |
| Prisma                           | 7.10.0 + `@prisma/adapter-pg` 7.10.0                                       |
| TypeScript                       | 6.0.3                                                                      |
| Jest                             | 30.5.2 (+ ts-jest 29.4.14, Supertest 7.3.0)                                |
| ESLint                           | 10.11.0 (+ typescript-eslint 8.70.1)                                       |
| Prettier                         | 3.9.9                                                                      |
| dependency-cruiser               | 18.4.0                                                                     |
| pino                             | nestjs-pino 5.2.1 + pino-http 11.0.0                                       |
| Zod                              | 4.6.5                                                                      |
| ioredis                          | 6.0.0                                                                      |
| argon2                           | 0.45.1                                                                     |
| husky / lint-staged / commitlint | 9.1.7 / 17.6.0 / 21.2.3                                                    |

## 7. Decisiones y discrepancias

**Decisiones (ADR):** ADR-001 (monolito modular en Docker Compose), ADR-002 (hexagonal
verificada con dependency-cruiser), ADR-010 (modelo de datos completo en la migración
inicial), ADR-011 (alcance mínimo de `compose.dev.yaml`), ADR-012 (`/health` con
Terminus en el prefijo `/api/v1`) y la renumeración de los ADR previos a los IDs de la
tabla 11-1 (`docs/adr/README.md`).

**Discrepancias entre los documentos y la realidad:**

1. **NestJS 12 es ESM-only** y el proyecto es CommonJS: se usa **NestJS 11** (última línea
   compatible). Documentado en README y ADR-002.
2. **TypeScript 7** no está soportado por los peers de `typescript-eslint` y `ts-jest`:
   se usa **6.0.3** (última soportada).
3. **`prisma@latest` apunta a 8.0.0-rc**: se usa la última estable, **7.10.0**.
4. **Corepack ya no se distribuye con Node ≥ 25**: se fija la versión con `packageManager`
   y el README indica cómo instalar pnpm.
5. **Node 24 LTS** no estaba instalado en el entorno de verificación (se usó 26.7.0,
   dentro de `engines`); el CI sí fija Node 24 con `.nvmrc`.
6. La **migración inicial se consolidó** (squash) al alinear el esquema con §9.0; una base
   ya migrada requiere `prisma migrate reset` (ADR-010).
7. Los catálogos **`Ramo` y `MetodoPago`** llevan un campo `codigo` (además de `nombre` y
   `activo`) para conservar el contrato del API y de la SPA; es un campo adicional, no una
   contradicción de §9.0.
8. **`Pago.nota`** se conserva como nota de auditoría interna, junto a `motivoRechazo`
   (§9.0), que guarda el motivo obligatorio del rechazo.
9. **`arquitectura_img/`** no está versionado: los diagramas originales no se entregaron
   como archivos sueltos (`docs/referencia/arquitectura_img/README.md` lista los PNG).
10. **Docker Compose se ejecutó con el cliente de Windows** (`docker.exe`); los puertos
    quedaron publicados solo en `127.0.0.1`.

## 8. Impedimentos y observaciones

- El primer pipeline en `main` falló porque el cliente de Prisma no se versiona y la
  migración/siembra corría antes de generarlo; corregido el orden en `ci.yml` (`868e89b`).
- Con Redis detenido, `ioredis` (configurado por BullMQ con `maxRetriesPerRequest: null`)
  encolaba el `ping` indefinidamente; se añadió un **tiempo límite de 2 s** a los
  indicadores, con prueba unitaria y demostración real del 503.
- El clon desde cero detectó que el seed interpretaba `SEED_*` **vacías** como válidas;
  corregido: cadena vacía equivale a ausente y en producción se niega a usar las
  contraseñas por defecto.
- Las reglas ESLint con tipos aplican al código de aplicación (`apps/api/src/**`,
  `packages/shared/src/**`); pruebas y e2e quedan con el config base.

## 9. Deuda y trabajo fuera de alcance (para sprints siguientes)

- `ADR-007` (API y worker separados) y `ADR-008` (contrato inmutable) se redactan en sus
  sprints.
- Los módulos `notificaciones/`, `reportes/` y `auditoria/` existen como carpeta con
  `.gitkeep` (S2, S11 y S14).
- El seed crea datos de demostración para e2e y desarrollo; los datos reales de Oasis
  Seguros llegan en S15 (HT-09).
- El job **Slither** falla (`crytic-compile` no resuelve los tests Foundry de los
  artefactos): es alcance de HT-02 (S2), excluirlos del análisis y dejarlo en verde.
- Documentos originales `.docx` (arquitectura y ERS) sin versionar: decidir si se
  incorporan. Los PNG de `arquitectura_img/` siguen pendientes.

## 10. Cómo verificar

```bash
# Calidad (sin infraestructura)
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                       # 58 API + 33 SPA + 26 contratos

# Infraestructura de desarrollo
docker compose -f compose.dev.yaml up -d postgres redis
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed                     # dos veces: idempotente
curl http://localhost:3000/api/v1/health          # 200 con ambos servicios

# Extremo a extremo (requiere nodo Hardhat y contrato desplegado)
pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1 &
pnpm dev:chain
pnpm test:e2e                   # 3 suites, 10 pruebas
```
