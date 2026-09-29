# Oasis Seguros — Sistema web con anclaje blockchain

Monorepo del sistema administrativo del bróker de seguros **Oasis Seguros (Ecuador)**.
Un OPERADOR valida un pago, el sistema emite un recibo y su hash se ancla en
**Polygon PoS (testnet Amoy)** mediante el contrato `RegistroRecibos`. Cualquier persona
puede verificar un recibo desde una página pública (código o QR), sin login y sin que se
exponga ningún dato personal.

> Trabajo de Titulación de Ingeniería de Software. Estado: **F0–F6 completadas**.

## Arquitectura en una mirada

- **Backend** (`apps/api`): NestJS 11 (CommonJS) con **arquitectura hexagonal** por
  módulo: `auth`, `usuarios`, `clientes`, `aseguradoras`, `polizas`, `pagos` y `recibos`
  (el "Módulo Blockchain"). La regla de dependencias se verifica con dependency-cruiser.
- **Worker**: segundo entrypoint de la misma imagen. Único contenedor con la clave
  operadora (firma custodial); procesa la cola `anclaje-recibos` (concurrencia 1) y hace
  un barrido cada 30 s.
- **Integración blockchain**: oráculo de salida _push-based_ + **Transactional Outbox**;
  el hash del recibo es `keccak256(sal ‖ payloadCanónico RFC 8785)` y el `idOnchain` es
  `keccak256(uuid)`. En la cadena solo hay dos `bytes32`: **ningún dato personal**.
- **Frontend** (`apps/web`): SPA React 19 + Vite + Tailwind v4 + componentes shadcn/ui,
  por feature, con TanStack Query y React Hook Form + Zod reutilizando `packages/shared`.
- **Infraestructura**: Caddy (SPA + reverse proxy `/api/*`, TLS automático), PostgreSQL
  17, Redis 7, Prisma 7 con driver adapter `pg`, BullMQ. Mismo origen ⇒ sin CORS; el
  refresh token viaja en cookie `httpOnly`/`Secure`/`SameSite=Strict` con rotación.
- **Medición**: `/metrics` (prom-client) solo en la red interna y stack opcional
  Prometheus + Grafana + cAdvisor + node-exporter.
- Documentación: `docs/referencia` (fuentes de verdad), `docs/arquitectura` (C4 +
  secuencia en Mermaid), `docs/adr` (12 ADR), `docs/sprints` y `docs/despliegue.md`.

## Estructura

```
apps/api              API + worker (NestJS, hexagonal, Prisma, BullMQ, viem)
apps/web              SPA (Vite, React 19, shadcn/ui)
packages/shared       Esquemas Zod, constantes, tipos y ABI (generado)
packages/contracts    RegistroRecibos.sol + Hardhat 3 + Ignition + tests
infra/                monitoring/, k6/ y scripts/ (bootstrap, backup, restore, deploy)
docs/                 arquitectura/, adr/, despliegue.md
compose.dev|prod|monitoring.yaml
```

## Requisitos

- Node.js **24 LTS** (`.nvmrc`; el CI y las imágenes usan Node 24).
- **pnpm** (el campo `packageManager` fija `12.3.4`).
- Docker + Docker Compose (PostgreSQL, Redis y nodo Hardhat en desarrollo).

```bash
nvm use                                   # Node 24
npm install -g pnpm@12                    # o instalar corepack por separado
pnpm install
cp .env.example apps/api/.env             # y completar secretos locales
pnpm --filter @oasis/api exec prisma migrate deploy   # esquema + tablas
pnpm --filter @oasis/api seed                           # datos iniciales
```

`prisma generate` corre como parte de `pnpm --filter @oasis/api build` (y del
`build` raíz), así que el cliente generado existe antes de compilar o de sembrar.

## Desarrollo (rápido)

```bash
pnpm dev:infra                 # postgres + redis (+ nodo Hardhat en Docker)
pnpm --filter @oasis/contracts exec hardhat node   # alternativa nativa al nodo Docker
pnpm dev:chain                 # Ignition + REGISTRADOR_ROLE + apps/api/.env
pnpm dev                       # API, worker y SPA con recarga en caliente
```

- SPA: http://localhost:5173 · API: http://localhost:3000/api/v1 · Swagger: `/api/docs`
- Usuarios del seed: `admin@oasis.com` / `operador@oasis.com` / `cliente@oasis.com`
  (contraseñas `Admin.Oasis1`, `Operador.Oasis1`, `Cliente.Oasis1`).

## Scripts raíz

| Script                                       | Descripción                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm build` / `lint` / `typecheck` / `test` | Tareas en todo el workspace.                                                            |
| `pnpm test:e2e`                              | E2E del API (requiere la infraestructura arriba).                                       |
| `pnpm deps:check`                            | Verifica la regla hexagonal.                                                            |
| `pnpm deps:check:negativo`                   | Prueba negativa: confirma que `deps:check` falla si el dominio importa infraestructura. |
| `pnpm dev:infra` / `dev:infra:down`          | Postgres, Redis y nodo Hardhat (compose.dev).                                           |
| `pnpm dev:chain`                             | Despliegue local (Ignition) + rol + `.env` del API.                                     |
| `pnpm dev`                                   | API + worker + SPA en modo desarrollo.                                                  |
| `pnpm format` / `format:check`               | Prettier sobre el monorepo.                                                             |
| `pnpm --filter @oasis/contracts reporte`     | Cobertura (con umbral) y reporte de gas.                                                |

## Pruebas

| Suite         | Comando                                  | Qué cubre                                                                                                                                                                                   |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contratos     | `pnpm --filter @oasis/contracts test`    | 26 casos: Solidity (unit + fuzz, 16) y viem (roles, duplicados, pausa, eventos, 10).                                                                                                        |
| Contratos     | `pnpm --filter @oasis/contracts reporte` | Verifica el umbral de cobertura y regenera `REPORTE-COBERTURA.md` y `REPORTE-GAS.md`. Falla si las líneas cubiertas bajan del 90 %.                                                         |
| API unitarias | `pnpm --filter @oasis/api test`          | 34 casos: hash y canonicalización, transiciones del Recibo, login, y el módulo blockchain (outbox, idempotencia del anclaje, verificación pública).                                         |
| API e2e       | `pnpm --filter @oasis/api test:e2e`      | Flujo completo contra Hardhat local + escenarios de idempotencia con caída simulada del worker.                                                                                             |
| SPA           | `pnpm --filter @oasis/web test`          | 33 casos: `api-client` (401 → refresh → reintento, deduplicación del refresco, contrato de error), esquemas compartidos de Zod y el diálogo de confirmación de pagos.                       |
| SPA e2e       | `pnpm --filter @oasis/web test:e2e`      | Playwright: login → validar pago (con confirmación) → ANCLADO → QR → verificación pública sin sesión. El webServer de Playwright levanta Hardhat, despliega, y arranca API + worker + Vite. |

**Límites de las pruebas.** Los e2e (API y Playwright) son de pila completa:
necesitan PostgreSQL, Redis, el nodo Hardhat con el contrato desplegado y la API
compilada (`pnpm -r build`). El job `web` de CI **no** los ejecuta; para correrlos
localmente:

```bash
pnpm dev:infra && pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy && pnpm --filter @oasis/api seed
pnpm -r build
pnpm test:e2e && pnpm --filter @oasis/web test:e2e
```

**Cobertura de contratos: qué se mide y qué no.** El plugin de cobertura de
Hardhat 3 instrumenta líneas y sentencias, **no ramas ni funciones**. Su informe
HTML muestra «Branches 100 %» y «Functions 100 %» con 0 elementos instrumentados,
que es una casilla vacía de la plantilla. `REPORTE-COBERTURA.md` solo afirma
líneas y sentencias (100 %), y explica la limitación. Medir ramas de verdad exige
migrar los tests a Foundry (`forge coverage`), fuera del stack acordado.

## Producción

Ver `docs/despliegue.md` (VPS Ubuntu 24.04 en OVHcloud, TLS automático con Caddy,
hardening, backups con rotación de 7 días, despliegue del contrato en Amoy con
`hardhat-keystore` y verificación con Etherscan V2, y checklist de evaluación).

```bash
docker compose -f compose.prod.yaml up -d
docker compose -f compose.prod.yaml -f compose.monitoring.yaml up -d   # evaluación
```

## Seguridad

- Ningún dato personal ni monto se escribe en la blockchain: solo `idOnchain` y
  `hashRecibo` (`bytes32`), con sal aleatoria que nunca sale de PostgreSQL (ADR-004).
- `OPERATOR_PRIVATE_KEY` **solo** existe en el contenedor `worker`: vive en `.env.worker`
  (plantilla en `.env.worker.example`), que `compose.prod.yaml` inyecta únicamente en ese
  servicio. Ni `.env` ni el entorno del `api` o del `migrate` la contienen, y el esquema de
  entorno del API tampoco la incluye (ADR-006).
- `.env` y `.env.worker` ignorados por git; `.env.example` y `.env.worker.example`
  documentan las variables; ningún secreto se versiona.
- Contraseñas con argon2; JWT de acceso de 15 min; refresh de 7 días con rotación y
  detección de reutilización.
- Throttling, helmet, validación Zod de entradas y de entorno, filtro global de errores.

## Variables de entorno

`.env.example` y `.env.worker.example` son las plantillas comentadas. Resumen:

| Variable                                                                     | Dónde                        | Por defecto                      | Para qué                                                                                              |
| ---------------------------------------------------------------------------- | ---------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                                   | ambos                        | `development`                    | `development` \| `test` \| `production`. Condiciona Swagger y CORS.                                   |
| `PORT`                                                                       | API                          | `3000`                           | Puerto HTTP del API.                                                                                  |
| `LOG_LEVEL`                                                                  | ambos                        | `info`                           | Nivel de pino (`trace`…`fatal`).                                                                      |
| `LOG_PRETTY`                                                                 | desarrollo                   | `false`                          | Salida legible solo con `pnpm dev:pretty`; en JSON por defecto.                                       |
| `CORS_ORIGIN`                                                                | desarrollo                   | `http://localhost:5173`          | Orígenes del SPA (lista por comas). En producción no aplica (mismo origen).                           |
| `METRICS_APP` / `WORKER_METRICS_PORT`                                        | worker                       | `oasis-api` / `9101`             | Etiqueta de Prometheus y exporter del worker (red interna).                                           |
| `DATABASE_URL`                                                               | ambos                        | —                                | Cadena de conexión de PostgreSQL. En Docker el host es `postgres`.                                    |
| `REDIS_HOST` / `REDIS_PORT`                                                  | ambos                        | `localhost` / `6379`             | Redis de BullMQ y de los refresh tokens.                                                              |
| `REDIS_PASSWORD`                                                             | ambos                        | vacío                            | Opcional.                                                                                             |
| `JWT_ACCESS_SECRET`                                                          | ambos                        | —                                | Firma del access token (≥ 32 caracteres).                                                             |
| `JWT_REFRESH_SECRET`                                                         | ambos                        | —                                | Firma del refresh token, distinta de la anterior.                                                     |
| `JWT_ACCESS_TTL`                                                             | ambos                        | `15m`                            | Vigencia del access token.                                                                            |
| `JWT_REFRESH_TTL`                                                            | ambos                        | `7d`                             | Vigencia de la cookie httpOnly.                                                                       |
| `CHAIN_ID`                                                                   | ambos                        | `31337`                          | `31337` local \| `80002` Amoy \| `137` Polygon. Selecciona la chain en viem.                          |
| `RPC_URL`                                                                    | ambos                        | `http://127.0.0.1:8545`          | RPC principal.                                                                                        |
| `RPC_URL_FALLBACK`                                                           | ambos                        | vacío                            | RPC de respaldo (transporte `fallback` de viem).                                                      |
| `CONTRACT_ADDRESS`                                                           | ambos                        | vacío                            | Dirección de `RegistroRecibos`.                                                                       |
| `MAX_FEE_PER_GAS_GWEI`                                                       | ambos                        | `50`                             | Tope de `maxFeePerGas` al anclar.                                                                     |
| `EXPLORER_BASE_URL`                                                          | ambos                        | `https://amoy.polygonscan.com`   | Base de los enlaces públicos.                                                                         |
| `OPERATOR_PRIVATE_KEY`                                                       | **`.env.worker` únicamente** | —                                | Clave de la cuenta `REGISTRADOR_ROLE`. El API no la puede leer (ADR-006).                             |
| `OPERATOR_ADDRESS`                                                           | scripts de contratos         | —                                | Cuenta `REGISTRADOR_ROLE` para `grant-registrador.ts` (no es secreto).                                |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`                        | `.env` (Docker)              | `oasis`                          | Credenciales de la imagen de PostgreSQL en compose.                                                   |
| `SEED_ADMIN_EMAIL`                                                           | seed                         | `admin@oasis.com`                | Correo del ADMIN sembrado.                                                                            |
| `SEED_ADMIN_PASSWORD` / `SEED_OPERADOR_PASSWORD` / `SEED_CLIENTE_PASSWORD`   | seed                         | `Admin.Oasis1` …                 | Contraseñas del seed (opcionales). En producción el seed **se niega** a usar los valores por defecto. |
| `THROTTLE_GLOBAL_LIMIT`                                                      | ambos                        | `100`                            | Peticiones/min por IP del límite global.                                                              |
| `THROTTLE_LOGIN_LIMIT`                                                       | ambos                        | `5`                              | Por minuto en `POST /auth/login`.                                                                     |
| `THROTTLE_REFRESH_LIMIT`                                                     | ambos                        | `20`                             | Por minuto en `/auth/refresh` y `/auth/logout`.                                                       |
| `THROTTLE_VERIFICACION_PUBLICA_LIMIT`                                        | ambos                        | `20`                             | Por minuto en la verificación pública.                                                                |
| `WORKER_METRICS_PORT`                                                        | worker                       | `9101`                           | Exporter de métricas del anclaje (red interna).                                                       |
| `DOMAIN`                                                                     | ambos                        | `localhost`                      | Dominio que sirve Caddy con TLS automático.                                                           |
| `OASIS_API_IMAGE` / `OASIS_MIGRATOR_IMAGE` / `OASIS_WEB_IMAGE` / `OASIS_TAG` | `.env`                       | `ghcr.io/oasis-seguros/*:latest` | Imágenes y etiqueta de `compose.prod.yaml`.                                                           |
| `GRAFANA_ADMIN_PASSWORD`                                                     | `.env`                       | —                                | Solo el día de evaluación (`compose.monitoring.yaml`).                                                |
| `VITE_API_BASE_URL`                                                          | SPA                          | `/api/v1`                        | Solo en `pnpm dev`; en producción Caddy sirve el mismo origen.                                        |

## Notas de fidelidad a la documentación oficial

Desviaciones respecto al enunciado, tomadas siguiendo la documentación vigente:

1. **TypeScript**: la última estable es 7.x, pero `typescript-eslint` (peer `<6.1.0`) y
   `ts-jest` (peer `<7`) aún no la soportan; se usa la última soportada, **6.0.3**.
2. **Prisma**: el dist-tag `latest` de `prisma` apunta a un _release candidate_ (8.0.0-rc);
   se usa la última estable **7.10.0** con `@prisma/adapter-pg`.
3. **Corepack**: Node.js ≥ 25 ya no incluye corepack; se fija la versión con
   `packageManager` y se recomienda `npm i -g pnpm@12`.
4. **pnpm 12**: reemplazó `onlyBuiltDependencies` por `allowBuilds`; se declaran **ambas**
   claves para compatibilidad. `pnpm deploy` requiere `--legacy` sin inyección de
   paquetes del workspace (usado en el Dockerfile del API).
5. **Hardhat 3**: los tests de Solidity requieren `forge-std`; los tipos de viem se toman
   de `artifacts/**/artifacts.d.ts`, por eso el `typecheck` de contratos compila primero.
6. **NestJS**: la versión 12 es **ESM-only**, incompatible con el modo CommonJS pedido;
   ante el conflicto se priorizó CommonJS y se usa **NestJS 11** (última línea compatible).
   Migrar a ESM permitiría NestJS 12.
7. **prom-client**: la última estable (15.1.3) está marcada como deprecada en favor de
   `@prometheus-io/client` (0.16.x, aún inmadura); se mantiene prom-client y se reevaluará.
   Además, en lugar de `@willsoto/nestjs-prometheus` (que envuelve a prom-client y asume
   una aplicación HTTP de Nest) se usa un `MetricsModule` propio: el worker expone sus
   métricas con un servidor mínimo, sin aplicación HTTP.
8. **Imagen `oasis-api-migrator`**: el runtime no incluye el CLI de Prisma; se publica una
   segunda imagen (mismo Dockerfile, target `migrator`) para la tarea `migrate`.
9. **Cobertura de contratos**: el plugin de cobertura de Hardhat 3 no instrumenta ramas ni
   funciones, así que el umbral del 90 % se verifica sobre **líneas y sentencias** (100 %
   en la revisión actual). `packages/contracts/REPORTE-COBERTURA.md` documenta la
   limitación; medir ramas exigiría migrar los tests a Foundry.
10. **Límites del rate limiter**: son configurables por entorno. Los valores por defecto
    (5/min en login) son de seguridad y harían que una prueba de carga midiera el
    limitador en lugar del API, así que `docs/despliegue.md` indica subirlos el día de la
    evaluación y restaurarlos al terminar.
11. **Confirmación al validar un pago**: el enunciado pide que el operador valide un pago
    sin especificar la interfaz. Se añadió un diálogo con confirmación explícita y motivo
    de auditoría (`Pago.nota`), porque validar dispara una transacción real e
    irreversible. El API exige `confirmado: true`, de modo que la protección no depende
    solo de la SPA.

## Fases

- [x] **F0** Monorepo base (workspace, tooling, husky, commitlint).
- [x] **F1** `packages/shared` y `packages/contracts` (contrato, tests, ABI).
- [x] **F2** API base: config Zod, Prisma, auth, health, métricas, esqueleto hexagonal.
- [x] **F3** Walking skeleton e2e contra Hardhat local (+ idempotencia).
- [x] **F4** SPA: login, pagos, recibo con QR y verificación pública.
- [x] **F5** Docker: compose dev/prod/monitoring, Caddy, Grafana.
- [x] **F6** CI/CD, scripts, k6, docs C4, ADRs y despliegue.
