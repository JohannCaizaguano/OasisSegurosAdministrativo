# Sprint S1 — Monorepo, integración continua, backend base, contrato en Amoy y bitácora

- **Historias:** HT-01 Configuración del monorepo e integración continua (10 h), HT-03 Base del
  backend con arquitectura hexagonal (12 h), HT-02 Contrato inteligente RegistroRecibos (18 h) y
  HU-45 Bitácora de auditoría (6 h) — 46 de 50 horas de capacidad.
- **Épicas:** EP-07 Plataforma e infraestructura (HT-01, HT-03), EP-05 Recibos y blockchain (HT-02)
  y EP-09 Reportes y auditoría (HU-45).
- **Ramas:** `feat/sprint-01-base-monorepo-backend` (Etapa A) y `feat/sprint-02-contrato-bitacora`
  (Etapa B).
- **Fechas:** 07/09/2026 – 18/09/2026 (tabla 6-1 del backlog); la Etapa B se ejecutó entre el 01 y
  el 05/10/2026 y el despliegue en Amoy se firmó el 05/10/2026.
- **Commits:** `d58ccc6` Etapa A (integrada en `main` con `7a3c262`, PR #1) y `aaea4e9` Etapa B
  (integrada con `11a0e11`).
- **Ejecución:** agente local (OpenCode) sobre una copia del repositorio.
- **Estado:** criterios de aceptación completados en las dos etapas. Pendiente: aceptación del
  Product Owner.

> Verificación de la Etapa A ejecutada el **29/09/2026** y de la Etapa B el **05/10/2026**, cada una
> sobre la rama de su etapa; reproducible con los comandos de la sección 11.

## 1. Objetivo

Dejar lista la plataforma sobre la que se construye el resto del sistema: monorepo pnpm con calidad
automatizada y CI, y base del backend hexagonal con configuración validada, Prisma 7 con adaptador
`pg`, migración inicial, seed, `GET /health`, logs JSON con `requestId`, filtro global de errores y
regla de dependencias verificada (Etapa A). Sobre esa base, cerrar el contrato `RegistroRecibos`
congelado, probado y analizado, **desplegado y verificado en Amoy** con un hash de prueba registrado
por la cuenta operadora, y la bitácora de auditoría de solo inserción, capturada de forma declarativa
y consultable por el ADMIN en el API y en la SPA (Etapa B).

## 2. Entregables

### Etapa A (HT-01, HT-03)

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

### Etapa B (HT-02, HU-45)

| Entregable                                                                     | Ubicación                                                                                                                   |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 30 pruebas del contrato (18 Solidity + 12 viem), con errores exactos y eventos | `packages/contracts/test/RegistroRecibos.t.sol`, `.test.ts`                                                                 |
| Reportes de cobertura y gas regenerados                                        | `packages/contracts/REPORTE-COBERTURA.md`, `REPORTE-GAS.md`                                                                 |
| Slither sobre el archivo del contrato (`fail_on: medium`)                      | `packages/contracts/slither.config.json`, job `slither` de `.github/workflows/ci.yml`                                       |
| Red `amoyOperador` y scripts de operación                                      | `packages/contracts/hardhat.config.ts`, `scripts/cuentas.ts`, `scripts/grant-registrador.ts`, `scripts/registrar-prueba.ts` |
| Despliegue de Ignition versionado                                              | `packages/contracts/ignition/deployments/chain-80002/`                                                                      |
| Catálogo y esquemas compartidos de auditoría                                   | `packages/shared/src/constants/auditoria.ts`, `schemas/auditoria.schema.ts`                                                 |
| Módulo hexagonal `auditoria`                                                   | `apps/api/src/modules/auditoria/`                                                                                           |
| Decorador e interceptor global                                                 | `apps/api/src/common/auditoria/auditar.decorator.ts`, `.../auditoria.interceptor.ts`                                        |
| Migración de solo inserción (RN-17)                                            | `apps/api/prisma/migrations/20261001213141_bitacora_solo_insercion/`                                                        |
| `GET /api/v1/bitacora` (ADMIN, con filtros)                                    | `apps/api/src/modules/auditoria/presentation/http/bitacora.controller.ts`                                                   |
| Página "Bitácora" (ADMIN)                                                      | `apps/web/src/features/auditoria/`, `router.tsx`, `AppLayout.tsx`                                                           |
| ADR-008 y ADR-013                                                              | `docs/adr/ADR-008-contrato-inmutable.md`, `docs/adr/ADR-013-bitacora-auditoria.md`                                          |
| Documentación                                                                  | `docs/despliegue.md`, `README.md`, `CLAUDE.md`, `apps/api/src/modules/README.md`                                            |

## 3. Criterios de aceptación y evidencia

### HT-01 (Etapa A)

| #   | Criterio                                                                               | Evidencia                                                                                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El workspace contiene `apps/api`, `apps/web`, `packages/contracts` y `packages/shared` | `pnpm-workspace.yaml` (globs `apps/*`, `packages/*`) y los cuatro `package.json`; `pnpm -r build` compila los 4.                                                                                                                                                                      |
| 2   | ESLint, Prettier, husky, lint-staged y commitlint funcionan en cada commit             | `.lintstagedrc.json` + hooks `pre-commit` (lint-staged) y `commit-msg` (commitlint). En la rama commitlint rechazó un commit sin tipo/scope y el scope no permitido `adr`; los 20 siguientes pasaron.                                                                                 |
| 3   | `ci.yml` instala dependencias, ejecuta lint y construye en cada push y pull request    | `ci.yml`: `push` (main) y `pull_request`; `pnpm install --frozen-lockfile`, `lint`, `format:check`, `typecheck`, `deps:check`, `build`; jobs de contratos, API (Postgres 17 + Redis 7, `migrate deploy` y e2e), SPA e imágenes Docker; `permissions: contents: read` y `concurrency`. |
| 4   | El README describe cómo levantar el entorno local                                      | `README.md`: requisitos, instalación, `.env`, compose, migración, seed, `pnpm dev`, `/health`, pruebas y scripts.                                                                                                                                                                     |

### HT-03 (Etapa A)

| #   | Criterio                                                                        | Evidencia                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Las variables de entorno se validan con Zod y el API no arranca si falta alguna | `src/config/env.schema.ts` (esquema único; el error lista **todas** las variables con problema) y `env.schema.spec.ts` (3 casos). Sin `DATABASE_URL` el proceso termina con código 1 y la variable señalada; con tres valores inválidos los lista los tres.                                                                 |
| 2   | Prisma 7 con adaptador `pg`, migración inicial y seed                           | `prisma@7.10.0` + `@prisma/adapter-pg@7.10.0` (`prisma.config.ts`, `PrismaService`). `migrate deploy` aplica `20260929155339_init` (12 tablas, enums, únicos e índices) desde cero; el seed corre dos veces sin error y en producción se niega a usar la contraseña por defecto.                                            |
| 3   | `GET /health` informa PostgreSQL y Redis                                        | `GET /api/v1/health` → `200 {"status":"ok","info":{"database":{"status":"up"},"redis":{"status":"up"}}}`; con Redis detenido → `503` con el detalle y vuelve a 200 al reiniciarlo. Pruebas unitarias de los indicadores y e2e de 200/503.                                                                                   |
| 4   | Los logs son JSON e incluyen `requestId` por solicitud                          | `nestjs-pino` con JSON en todos los entornos (`LOG_PRETTY=true` solo con `pnpm dev:pretty`); `redact` de `authorization`, `cookie` y `set-cookie`; `genReqId` reutiliza `x-request-id` solo si es UUID válido. e2e: cabecera presente, valor entrante conservado, no-UUID descartado y `requestId` en el cuerpo de errores. |
| 5   | Un filtro global devuelve los errores en formato uniforme                       | `all-exceptions.filter.ts` con `statusCode`, `code`, `message`, `details`, `requestId`, `timestamp` y `path`; `DomainError` → HTTP (400/401/403/404/409/422/502), `HttpException` y `ZodError` con el mismo formato; error inesperado → 500 genérico sin stack (el detalle queda en el log). 9 unitarias + e2e de 404.      |
| 6   | dependency-cruiser falla si el dominio importa infraestructura                  | `pnpm deps:check` → 0 violaciones (169 módulos). `pnpm deps:check:negativo` crea un `domain/` que importa `infrastructure/`, confirma que `deps:check` falla (`error domain-sin-otras-capas`) y lo elimina.                                                                                                                 |

### HT-02 (Etapa B)

| #   | Criterio                                                                                                         | Evidencia                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `registrar` solo con `REGISTRADOR_ROLE`; rechaza identificadores repetidos y hash cero; emite `ReciboRegistrado` | Pruebas con los errores exactos (`AccessControlUnauthorizedAccount`, `ReciboYaRegistrado`, `IdReciboInvalido`, `HashReciboInvalido`) y aserción del evento; 30 pruebas en verde. |
| 2   | `anular`, `verificar`, `pause` y `unpause` funcionan según los roles                                             | Incluye `unpause` sin admin y anular con el contrato pausado (la pausa solo detiene registros nuevos, arquitectura §5.4).                                                        |
| 3   | Cobertura ≥ 90 % y reporte de gas por función                                                                    | `REPORTE-COBERTURA.md`: 100 % de líneas (23/23); `REPORTE-GAS.md`: `registrar` 78 411–78 423 (media 78 417); en Amoy, 84 242 (RNF-07: ≤ 100 000).                                |
| 4   | Slither sin hallazgos de severidad alta                                                                          | `0 result(s) found` con `fail_on: medium` (más estricto que RNF-14); job `slither` del CI.                                                                                       |
| 5   | Desplegado y verificado en Amoy, con script que registra un hash de prueba                                       | Sección 6: dirección, PolygonScan `#code`, Sourcify y salida de `registrar-prueba` (idempotente en la segunda ejecución).                                                        |
| 6   | El ABI tipado se exporta a `packages/shared`                                                                     | `export-abi` → 32 entradas y `git diff --exit-code packages/shared/src/abi` sin cambios; control de deriva en CI.                                                                |

### HU-45 (Etapa B)

| #   | Criterio                                                                                            | Evidencia                                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Se registran creación, modificación, validación, rechazo, anulación, inicio de sesión e importación | `auditoria-cobertura.spec.ts` exige `@Auditar` en los 15 handlers de mutación; e2e de bitácora (7 casos) y aserción `VALIDAR` en `flujo-anclaje`. `IMPORTAR` queda declarada en el catálogo y la prueba de cobertura obligará a instrumentarla con HU-34 (S6). |
| 2   | Cada registro guarda usuario, fecha, IP, entidad afectada y acción                                  | Columnas de `BitacoraAuditoria`; e2e caso 1 (inicio de sesión con usuario, IP y ruta).                                                                                                                                                                         |
| 3   | Los registros no se modifican ni eliminan desde la aplicación (RN-17)                               | Trigger de PostgreSQL para UPDATE, DELETE y TRUNCATE; el puerto solo ofrece `registrar` y `listar`; e2e caso 7 comprueba los tres rechazos y que la fila queda intacta.                                                                                        |
| 4   | El ADMIN consulta la bitácora con filtros por usuario, acción y fecha                               | `GET /api/v1/bitacora` con fechas de Ecuador (UTC−5); e2e casos 4 a 6 (filtros, rango invertido → 400, OPERADOR → 403); página `/bitácora` con sus 3 pruebas de Vitest.                                                                                        |

## 4. Definición de Terminado (§2.3 del backlog)

| Ítem                                                    | Etapa A                                                                                                                 | Etapa B                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Cumple todos sus criterios de aceptación                | ✅ Sección 3                                                                                                            | ✅ Sección 3                                                                                                  |
| Pruebas automatizadas y CI en verde                     | ✅ 117 pruebas (58 API, 33 SPA, 26 contratos) + 10 e2e del API; CI del PR #1 con 5 de 6 jobs en verde (Slither, ver §8) | ✅ local: 30 contratos + 76 API (14 suites) + 36 SPA + 17 e2e del API (4 suites) + 1 de Playwright; Slither 0 |
| Código integrado en la rama principal por pull request  | ✅ PR #1, merge `7a3c262`                                                                                               | ✅ merge `11a0e11`                                                                                            |
| Funciona en el entorno de desarrollo con Docker Compose | ✅ PostgreSQL 17 + Redis 7 de `compose.dev.yaml`: migración desde cero, seed, `/health` y e2e                           | ✅ los mismos contenedores (cliente `docker.exe`); nodo Hardhat nativo, como permite el plan (§B9.1)          |
| Documentación afectada actualizada                      | ✅ `README.md`, `AGENTS.md`, `docs/adr/` (ADR-001, 002, 010, 011, 012) y `docs/arquitectura/`                           | ✅ `README.md`, `CLAUDE.md`, ADR-008, ADR-013, `docs/despliegue.md` y `apps/api/src/modules/README.md`        |
| El Product Owner la aceptó en la revisión del sprint    | ⏳ Pendiente                                                                                                            | ⏳ Pendiente                                                                                                  |

## 5. Versiones exactas

| Componente                        | Versión                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Node.js                           | 24 LTS objetivo (`.nvmrc`, `engines >=24 <27`); la verificación usó 26.7.0 (Node de Windows que ejecuta pnpm) |
| pnpm                              | 12.3.4 (`packageManager`)                                                                                     |
| NestJS                            | 11.2.6 (no 12: ESM-only)                                                                                      |
| Prisma                            | 7.10.0 + `@prisma/adapter-pg` 7.10.0                                                                          |
| TypeScript                        | 6.0.3                                                                                                         |
| Jest                              | 30.5.2 (+ ts-jest 29.4.14, Supertest 7.3.0)                                                                   |
| ESLint                            | 10.11.0 (+ typescript-eslint 8.70.1)                                                                          |
| Prettier                          | 3.9.9                                                                                                         |
| dependency-cruiser                | 18.4.0                                                                                                        |
| pino                              | nestjs-pino 5.2.1 + pino-http 11.0.0                                                                          |
| Zod                               | 4.6.5                                                                                                         |
| ioredis                           | 6.0.0                                                                                                         |
| argon2                            | 0.45.1                                                                                                        |
| husky / lint-staged / commitlint  | 9.1.7 / 17.6.0 / 21.2.3                                                                                       |
| Hardhat (Etapa B)                 | 3.18.0                                                                                                        |
| hardhat-ignition / hardhat-verify | 3.1.8 / 3.1.1                                                                                                 |
| OpenZeppelin Contracts            | 5.6.1                                                                                                         |
| solc                              | 0.8.28                                                                                                        |
| Slither                           | 0.11.6                                                                                                        |

## 6. Despliegue en Amoy

| Elemento                              | Valor                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dirección del contrato                | `0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b`                                                                                                                                                                                                                                              |
| Despliegue (admin)                    | tx `0x9d8f6508df047d6f357d79a7684032f43c04ff7dad7075e94190b368d990d7c6` · bloque 49 418 753 · gas 566 793 · ≈ 0,018137 POL                                                                                                                                                                |
| Cuenta admin (`DEFAULT_ADMIN_ROLE`)   | `0xf0992d47ac1fe44067b5ccf367024d8f6957e897`                                                                                                                                                                                                                                              |
| Cuenta operadora (`REGISTRADOR_ROLE`) | `0x07132217d5c7b412673bc997ba11bf0adf1044ac`                                                                                                                                                                                                                                              |
| `grantRole` (admin)                   | tx `0xa24269adef57eedcc2b2c0304536daae7afb605a48b7481a5256dfcd60edeb0b` · bloque 49 419 132 · gas 61 557 · ≈ 0,002499 POL                                                                                                                                                                 |
| Hash de prueba (operadora)            | id `0x5d9af3a7c29ff8fe131f8b148d3dbbc9ba4622b8d645b4baf1768b9dd25dc713` · hash `0xb7edceb7d880d50fec76179abb819eb6ab73ddbf1dd3b305b3d6d0a2204c6553` · tx `0xeec28204772749f55fedcea46ae7e41851192a0ccf964cc713e3dc6dd800e0fb` · bloque 49 419 171 · gas 84 242 · 0,002688372831655118 POL |
| `verificar(id)`                       | `existe=true`, `hash=0xb7edceb7…`, `registradoEn=2026-10-05T23:06:45.000Z`, `anulado=false`                                                                                                                                                                                               |
| Código verificado                     | [PolygonScan](https://amoy.polygonscan.com/address/0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b#code) y [Sourcify](https://sourcify.dev/server/repo-ui/80002/0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b)                                                                                    |

El costo total en Amoy fue ≈ 0,0233 POL (despliegue + rol + registro), dentro del presupuesto de
≈ 0,055 POL. El gas real de `registrar` (84 242) cumple RNF-07 con margen. El error `HHE80027` de
Blockscout durante `ignition verify` es esperado: Amoy no tiene Blockscout configurado; PolygonScan
y Sourcify sí verifican.

## 7. Decisiones y discrepancias

**Decisiones (ADR):** ADR-001 (monolito modular en Docker Compose), ADR-002 (hexagonal verificada
con dependency-cruiser), ADR-010 (modelo de datos completo en la migración inicial), ADR-011
(alcance mínimo de `compose.dev.yaml`), ADR-012 (`/health` con Terminus en el prefijo `/api/v1`) y
la renumeración de los ADR previos a los IDs de la tabla 11-1 (`docs/adr/README.md`) en la Etapa A;
ADR-008 (contrato inmutable, sin proxy) y ADR-013 (bitácora declarativa y de solo inserción) en la
Etapa B.

**Discrepancias entre los documentos y la realidad:**

1. **NestJS 12 es ESM-only** y el proyecto es CommonJS: se usa **NestJS 11** (última línea
   compatible). Documentado en README y ADR-002.
2. **TypeScript 7** no está soportado por los peers de `typescript-eslint` y `ts-jest`: se usa
   **6.0.3** (última soportada).
3. **`prisma@latest` apunta a 8.0.0-rc**: se usa la última estable, **7.10.0**.
4. **Corepack ya no se distribuye con Node ≥ 25**: se fija la versión con `packageManager` y el
   README indica cómo instalar pnpm.
5. **Node 24 LTS** no estaba instalado en la máquina de verificación (se usó 26.7.0, dentro de
   `engines`); el CI sí fija Node 24 con `.nvmrc`. En WSL había 22.22.1, pero `pnpm` es el binario
   de Windows y ejecuta los scripts con el Node de Windows.
6. La **migración inicial se consolidó** (squash) al alinear el esquema con §9.0; una base ya migrada
   requiere `prisma migrate reset` (ADR-010).
7. Los catálogos **`Ramo` y `MetodoPago`** llevan un campo `codigo` (además de `nombre` y `activo`)
   para conservar el contrato del API y de la SPA; es un campo adicional, no una contradicción de
   §9.0.
8. **`Pago.nota`** se conserva como nota de auditoría interna, junto a `motivoRechazo` (§9.0), que
   guarda el motivo obligatorio del rechazo.
9. **`arquitectura_img/`** no está versionado: los diagramas originales no se entregaron como
   archivos sueltos (`docs/referencia/arquitectura_img/README.md` lista los PNG).
10. **Docker Compose se ejecutó con el cliente de Windows** (`docker.exe`); los puertos quedaron
    publicados solo en `127.0.0.1`.
11. La matriz 8-1 del ERS v1.2 asigna HT-03 a un S0 que no existe; manda el backlog: HT-03 es de S1.
12. `rpc-amoy.polygon.technology` ya no resuelve (verificado el 01/10/2026): la documentación cita
    `https://polygon-amoy-bor-rpc.publicnode.com`.
13. En Slither 0.11.6 la clave válida es `fail_on`, no `fail_medium`; además se analiza el archivo
    del contrato y no el proyecto Hardhat (los tests Foundry rompen `crytic-compile`).
14. `construirDetalle` no agrega `campos` cuando el cuerpo no tiene claves; el pseudocódigo del plan
    los habría guardado vacíos, pero su caso de prueba pide omitirlos.
15. A 360 px el contenedor de la tabla de Bitácora lleva `min-w-0`: sin él, el `min-content` de la
    tabla estira la pista del grid y el `overflow-x-auto` interno no actúa.

## 8. Impedimentos y observaciones

### Etapa A

- El primer pipeline en `main` falló porque el cliente de Prisma no se versiona y la
  migración/siembra corría antes de generarlo; corregido el orden en `ci.yml` (`868e89b`).
- Con Redis detenido, `ioredis` (configurado por BullMQ con `maxRetriesPerRequest: null`) encolaba
  el `ping` indefinidamente; se añadió un **tiempo límite de 2 s** a los indicadores, con prueba
  unitaria y demostración real del 503.
- El clon desde cero detectó que el seed interpretaba `SEED_*` **vacías** como válidas; corregido:
  cadena vacía equivale a ausente y en producción se niega a usar las contraseñas por defecto.
- Las reglas ESLint con tipos aplican al código de aplicación (`apps/api/src/**`,
  `packages/shared/src/**`); pruebas y e2e quedan con el config base.
- El job **Slither** falló en el PR #1: `crytic-compile` no resuelve los tests Foundry de los
  artefactos. Es alcance de HT-02 y quedó en verde en la Etapa B, analizando solo el archivo del
  contrato.

### Etapa B

- El faucet de Alchemy exige saldo en mainnet; QuickNode y ETHGlobal no lo exigen.
- `hardhat ignition verify chain-80002` necesita `--network amoy`; sin él apunta a la red local 31337.
- **WSL:** las variables exportadas en la shell no llegan al `pnpm` de Windows; hay que pasarlas por
  `WSLENV` (documentado en `docs/despliegue.md`).
- La máquina de verificación tenía `CONTRACT_ADDRESS` como variable de entorno de Windows (residuo
  del despliegue en Amoy): pisa el `.env` local en los procesos de pnpm. La DoD se ejecutó pasando
  la dirección local por `WSLENV`; conviene eliminarla del sistema.
- Los trabajos de anclaje de las pruebas con Amoy quedaron en la cola de Redis y el worker los
  reintentó durante la primera corrida de Playwright; se limpió `bull:anclaje-recibos:*` antes de la
  corrida final.
- Vite no invalida el prebundle de un paquete del workspace cuando cambia su `dist`: tras agregar
  los exports de auditoría a `@oasis/shared` hubo que borrar `apps/web/node_modules/.vite`. No afecta
  a un clon limpio ni al CI.
- En Windows, `pnpm dev` arranca el watcher del worker con EPERM al recompilar (la carpeta `dist`
  está bloqueada) y el worker sale; API y SPA siguen. Los e2e y Playwright arrancan el worker desde
  `dist` y funcionan.

## 9. Horas de backlog

| Etapa | Historia  |  Horas |
| ----- | --------- | -----: |
| A     | HT-01     |     10 |
| A     | HT-03     |     12 |
| B     | HT-02     |     18 |
| B     | HU-45     |      6 |
|       | **Total** | **46** |

Son las horas del backlog sobre 50 de capacidad; el informe no reporta horas reales.

## 10. Deuda y fuera de alcance

| Deuda                                                                                       | Sprint destino |
| ------------------------------------------------------------------------------------------- | -------------- |
| Instrumentar la importación (`IMPORTAR`); la prueba de cobertura fallará hasta entonces     | S6 (HU-34)     |
| Registrar el motivo de la anulación y su hash en la cadena                                  | S6 (HU-27)     |
| ADR-007 (API y worker separados)                                                            | S4             |
| Módulos `notificaciones/` y `reportes/` (hoy carpetas con `.gitkeep`)                       | S6 y S8        |
| Datos reales de Oasis Seguros en lugar del seed de demostración                             | S8 (HT-09)     |
| Presupuesto de POL para las pruebas de carga (cada recibo anclado costó ≈ 0,0027 POL)       | S9 (HT-10)     |
| Desborde horizontal a 360 px de `/`, `/pagos` y `/recibos` (Bitácora quedó corregida)       | S2 (HT-04)     |
| Si algún día existe un segundo contrato, verificar con la dirección guardada en cada recibo | — (ADR-008)    |
| Decidir si se versionan los `.docx` de arquitectura y ERS, y los PNG de `arquitectura_img/` | —              |

## 11. Cómo verificar

```bash
# Calidad (sin infraestructura)
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                       # 30 contratos + 76 API + 36 SPA
pnpm --filter @oasis/contracts reporte
pnpm --filter @oasis/contracts export-abi && git diff --exit-code packages/shared/src/abi

# Infraestructura (PostgreSQL y Redis con compose; nodo Hardhat aparte)
docker compose -f compose.dev.yaml up -d postgres redis
pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1 &
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed                     # dos veces: idempotente
curl http://localhost:3000/api/v1/health          # 200 con ambos servicios
pnpm test:e2e                   # 4 suites, 17 pruebas
CONTRACT_ADDRESS=$(grep '^CONTRACT_ADDRESS=' apps/api/.env | cut -d= -f2) \
  pnpm --filter @oasis/contracts exec hardhat run scripts/registrar-prueba.ts --network localhost
pnpm --filter @oasis/web test:e2e   # Playwright: 1 prueba
```

`registrar-prueba` se ejecuta dos veces: la primera registra y la segunda informa que el recibo ya
existía. Si el entorno define `CONTRACT_ADDRESS` a nivel de sistema, pásalo por `WSLENV` para que el
proceso de Windows use la dirección local.
