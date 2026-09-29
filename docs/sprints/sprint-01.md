# Sprint 1 — Monorepo, integración continua y backend base

- **Historias:** HT-01 (10 h) y HT-03 (12 h) — 22 de 25 horas de capacidad.
- **Épica:** EP-07 Plataforma e infraestructura.
- **Rama de trabajo:** `feat/sprint-01-base-monorepo-backend` (sin publicar; el PR lo abre el autor).
- **Fecha real de inicio:** **\_ por completar _**
- **Fecha real de cierre:** **\_ por completar _**
- **Estado:** criterios de aceptación completados y verificados; pendientes de la Definición de
  Terminado que dependen de terceros (PR, CI en GitHub y aceptación del Product Owner).

> Verificación ejecutada el **29/09/2026** sobre la rama del sprint. Este informe se puede
> reproducir con los comandos de la última sección.

## 1. Objetivo

Disponer de un monorepo pnpm con herramientas de calidad y un pipeline de integración
continua, y de la base del backend con arquitectura hexagonal (configuración validada,
Prisma 7 con adaptador `pg`, migración inicial, seed, `GET /health`, logs JSON con
`requestId`, filtro global de errores y regla de dependencias verificada).

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

| #   | Criterio                                                                               | Evidencia                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El workspace contiene `apps/api`, `apps/web`, `packages/contracts` y `packages/shared` | `pnpm-workspace.yaml` (globs `apps/*`, `packages/*`) y los cuatro `package.json`. Verificado con `pnpm -r build` (4 paquetes compilan).                                                                                                                                                                                                                                                                                                  |
| 2   | ESLint, Prettier, husky, lint-staged y commitlint funcionan en cada commit             | El hook `pre-commit` ejecuta lint-staged (Prettier + ESLint `--fix`) y el hook `commit-msg` ejecuta commitlint: en esta rama commitlint **rechazó** `actualice la configuracion del pipeline` (`subject-empty`, `type-empty`) y el scope no permitido `adr`; los 20 commits siguientes pasaron por ambos hooks. `.lintstagedrc.json`, `commitlint.config.mjs`.                                                                           |
| 3   | `ci.yml` instala dependencias, ejecuta lint y construye en cada push y pull request    | `.github/workflows/ci.yml`: disparadores `push` (main) y `pull_request`, `pnpm install --frozen-lockfile`, `pnpm -r lint`, `pnpm format:check`, `pnpm -r typecheck`, `pnpm deps:check`, `pnpm -r build`, jobs de contratos, API (con Postgres 17 y Redis 7 como servicios, `prisma migrate deploy` y e2e), SPA e imágenes Docker; `permissions: contents: read` y `concurrency`. Los mismos comandos se ejecutaron en local (sección 7). |
| 4   | El README describe cómo levantar el entorno local                                      | `README.md`: requisitos, instalación, `cp .env.example apps/api/.env`, `docker compose -f compose.dev.yaml up -d`, migración, seed, `pnpm dev`, verificación de `/health`, pruebas y scripts.                                                                                                                                                                                                                                            |

## 4. Criterios de aceptación — HT-03

| #   | Criterio                                                                        | Evidencia                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Las variables de entorno se validan con Zod y el API no arranca si falta alguna | `apps/api/src/config/env.schema.ts` (esquema único; el error lista **todas** las variables con problema) y `src/config/env.schema.spec.ts` (3 casos). Demostrado: sin `DATABASE_URL` el proceso termina con código 1 y `- DATABASE_URL: Invalid input: expected string, received undefined`; con `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` y `RPC_URL` inválidas lista las tres.      |
| 2   | Prisma 7 con adaptador `pg`, migración inicial y seed                           | `prisma@7.10.0` + `@prisma/adapter-pg@7.10.0` (configuración en `prisma.config.ts` y `PrismaService`). `prisma migrate deploy` aplica `20260929155339_init` (12 tablas, enums, únicos e índices) **desde cero** en una base nueva; el seed corre dos veces sin error (idempotente) y se niega a ejecutarse en producción con la contraseña por defecto.                               |
| 3   | `GET /health` informa PostgreSQL y Redis                                        | `GET /api/v1/health` → `200 {"status":"ok","info":{"database":{"status":"up"},"redis":{"status":"up"}}}`; con `docker stop oasis-redis-dev` → `503` con el detalle (`redis: {status:"down", message:"Redis no respondió en 2000 ms"}`) y vuelve a 200 al reiniciar Redis. Pruebas: unitarias de los indicadores y e2e de 200/503.                                                     |
| 4   | Los logs son JSON e incluyen `requestId` por solicitud                          | `nestjs-pino` con salida JSON en todos los entornos (`LOG_PRETTY=true` solo con `pnpm dev:pretty`), `redact` de `authorization`, `cookie` y `set-cookie`, `genReqId` que reutiliza `x-request-id` **solo si es un UUID válido** y si no genera uno. e2e: cabecera presente, valor entrante conservado y valor no UUID descartado; el `requestId` aparece en el cuerpo de los errores. |
| 5   | Un filtro global devuelve los errores en formato uniforme                       | `all-exceptions.filter.ts` con `statusCode`, `code`, `message`, `details`, `requestId`, `timestamp` y `path`; `DomainError` → HTTP (400/401/403/404/409/422/502), `HttpException` y `ZodError` con el mismo formato, y error inesperado → 500 genérico sin stack ni datos internos (el detalle queda en el log). 9 pruebas unitarias + e2e de 404 con `requestId`.                    |
| 6   | dependency-cruiser falla si el dominio importa infraestructura                  | `pnpm deps:check` → 0 violaciones (169 módulos). `pnpm deps:check:negativo` crea un `domain/` que importa `infrastructure/`, confirma que `deps:check` falla (`error domain-sin-otras-capas`) y elimina el archivo. Reglas de error en `apps/api/.dependency-cruiser.cjs`.                                                                                                            |

## 5. Definición de Terminado (§2.3 del backlog)

| Ítem                                                        | Estado | Nota                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cumple todos sus criterios de aceptación                    | ✅     | Secciones 3 y 4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Pruebas automatizadas y CI en verde                         | ✅     | 117 pruebas (58 API, 33 SPA, 26 contratos) + 10 e2e del API. **CI en el PR [#1](https://github.com/JohannCaizaguano/OasisSegurosAdministrativo/pull/1)**: 5 de 6 jobs en verde (calidad, contratos, SPA, API con migración+seed+e2e, e imágenes Docker). El job **Slither** falla y queda como deuda de HT-02 (S2): `crytic-compile` no resuelve las rutas de los tests Foundry que Hardhat 3 incluye en los artefactos (`project/test/RegistroRecibos.t.sol`). La primera ejecución sobre `main` falló en "Migrar y sembrar" porque el cliente de Prisma no se generaba antes del seed; corregido en `868e89b`. |
| Código integrado en la rama principal mediante pull request | ⏳     | PR [#1](https://github.com/JohannCaizaguano/OasisSegurosAdministrativo/pull/1) abierto contra `main`; pendiente la revisión y el merge del autor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Funciona en el entorno de desarrollo con Docker Compose     | ✅     | `compose.dev.yaml` (PostgreSQL 17 + Redis 7): migración desde cero, seed, `/health` y e2e ejecutados contra esos contenedores.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Documentación afectada actualizada                          | ✅     | `README.md`, `AGENTS.md`, `docs/adr/` (ADR-001, 002, 010, 011, 012 y renumeración), `docs/arquitectura/` y este informe.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| El Product Owner la aceptó en la revisión del sprint        | ⏳     | Pendiente de la revisión semanal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## 6. Versiones exactas

| Componente                       | Versión                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| Node.js                          | 24 LTS objetivo (`.nvmrc`, `engines >=24 <27`); la verificación se ejecutó con 26.7.0 |
| pnpm                             | 12.3.4 (`packageManager`)                                                             |
| NestJS                           | 11.2.6 (no 12: ESM-only)                                                              |
| Prisma                           | 7.10.0 + `@prisma/adapter-pg` 7.10.0                                                  |
| TypeScript                       | 6.0.3                                                                                 |
| Jest                             | 30.5.2 (+ ts-jest 29.4.14, Supertest 7.3.0)                                           |
| ESLint                           | 10.11.0 (+ typescript-eslint 8.70.1)                                                  |
| Prettier                         | 3.9.9                                                                                 |
| dependency-cruiser               | 18.4.0                                                                                |
| pino                             | nestjs-pino 5.2.1 + pino-http 11.0.0                                                  |
| Zod                              | 4.6.5                                                                                 |
| ioredis                          | 6.0.0                                                                                 |
| argon2                           | 0.45.1                                                                                |
| husky / lint-staged / commitlint | 9.1.7 / 17.6.0 / 21.2.3                                                               |

## 7. Decisiones y discrepancias

**Decisiones (ADR):**

- `ADR-001` Monolito modular en contenedores con Docker Compose en un VPS.
- `ADR-002` Arquitectura hexagonal por módulo, verificada con dependency-cruiser.
- `ADR-010` Modelo de datos completo en la migración inicial (consolidación previa al despliegue).
- `ADR-011` Alcance mínimo de `compose.dev.yaml` en el Sprint 1.
- `ADR-012` `/health` con Terminus, dentro del prefijo `/api/v1` y sin filtrar detalles.
- Renumeración de los ADR existentes (`0001`–`0006` → IDs de la tabla 11-1 de la arquitectura;
  índice en `docs/adr/README.md`).

**Discrepancias entre los documentos y la realidad:**

1. **NestJS 12 es ESM-only**; el proyecto es CommonJS, así que usa **NestJS 11** (última línea
   compatible). Documentado en el README y en el ADR-002.
2. **TypeScript 7** no está soportado por los peers de `typescript-eslint` y `ts-jest`; se usa
   **6.0.3** (última soportada).
3. **`prisma@latest` apunta a 8.0.0-rc**; se usa la última estable, **7.10.0**.
4. **Corepack ya no se distribuye con Node ≥ 25**; se fija la versión con `packageManager` y el
   README indica cómo instalar pnpm.
5. **Node 24 LTS** no está instalado en el entorno de verificación (se ejecutó con 26.7.0, dentro
   de `engines`); el CI sí fija Node 24 con `.nvmrc`.
6. La **migración inicial se consolidó** (squash) al alinear el esquema con §9.0; una base de
   desarrollo ya migrada requiere `prisma migrate reset` (ADR-010).
7. Los catálogos **`Ramo` y `MetodoPago`** llevan un campo `codigo` (además de `nombre` y
   `activo`) para conservar el contrato del API y de la SPA; es un campo adicional, no una
   contradicción de §9.0.
8. **`Pago.nota`** se conserva como nota de auditoría interna del operador, junto a
   `motivoRechazo` (§9.0), que ahora guarda el motivo obligatorio del rechazo.
9. **`arquitectura_img/`** no está versionado: los diagramas originales no se entregaron como
   archivos sueltos. `docs/referencia/arquitectura_img/README.md` lista los PNG esperados.
10. **Docker Compose se ejecutó con el cliente de Windows** (`docker.exe`) porque la máquina de
    verificación no tiene integración WSL; los puertos quedaron publicados solo en `127.0.0.1`.

## 8. Impedimentos y observaciones

- La primera ejecución del pipeline en GitHub (push a `main`) falló porque el cliente de Prisma
  no se versiona y el paso de migración/siembra corría antes de generarlo. Se corrigió el orden en
  `ci.yml` (`868e89b`) y se validó reproduciendo el job completo en un clon limpio.
- Con Redis detenido, `ioredis` (configurado por BullMQ con `maxRetriesPerRequest: null`) encolaba
  el `ping` indefinidamente y `/health` no respondía. Se añadió un **tiempo límite de 2 s** a los
  indicadores, con prueba unitaria y demostración real del 503.
- El clon desde cero detectó que el seed interpretaba `SEED_*` **vacías** (como las deja
  `.env.example`) como valores válidos; corregido: la cadena vacía equivale a ausente y en
  producción el seed se niega a usar los valores por defecto.
- Las reglas ESLint con información de tipos se aplican al código de aplicación
  (`apps/api/src/**`, `packages/shared/src/**`); las pruebas y los e2e quedan con el config base
  porque viven en `tsconfig.spec.json`/`jest-e2e.json`.

## 9. Deuda y trabajo fuera de alcance (para sprints siguientes)

- `ADR-007` (API y worker como procesos separados) y `ADR-008` (contrato inmutable) se redactan en
  sus sprints.
- Los módulos `notificaciones/`, `reportes/` y `auditoria/` existen como carpeta con `.gitkeep`
  (S2, S11 y S14).
- El seed crea una aseguradora, un cliente y una póliza de demostración para que los e2e y el
  desarrollo local tengan datos; los datos reales de Oasis Seguros llegan en S15 (HT-09).
- El job **Slither** de `ci.yml` falla: `crytic-compile` (Hardhat) no resuelve las rutas de los
  tests Foundry que Hardhat 3 registra en los artefactos (`Unknown file:
project/test/RegistroRecibos.t.sol`). Es alcance de HT-02 (S2): excluir los tests de la
  compilación que analiza Slither (o configurar `crytic-compile`) y dejar el análisis en verde junto
  con el contrato.
- Documentos originales `.docx` (arquitectura y ERS) sin versionar: decidir si se incorporan.
- Los diagramas `arquitectura_img/*.png` quedan pendientes de versionar.

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
