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
- Documentación: `docs/arquitectura` (C4 + secuencia en Mermaid), `docs/adr` (6 ADR) y
  `docs/despliegue.md`.

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

| Script                                       | Descripción                                         |
| -------------------------------------------- | --------------------------------------------------- |
| `pnpm build` / `lint` / `typecheck` / `test` | Tareas en todo el workspace.                        |
| `pnpm test:e2e`                              | E2E del API (requiere la infraestructura arriba).   |
| `pnpm depcruise`                             | Verifica la regla hexagonal.                        |
| `pnpm dev:infra` / `dev:infra:down`          | Postgres, Redis y nodo Hardhat (compose.dev).       |
| `pnpm dev:chain`                             | Despliegue local (Ignition) + rol + `.env` del API. |
| `pnpm dev`                                   | API + worker + SPA en modo desarrollo.              |
| `pnpm format` / `format:check`               | Prettier sobre el monorepo.                         |

## Pruebas

| Suite         | Comando                               | Qué cubre                                                                                                                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contratos     | `pnpm --filter @oasis/contracts test` | Solidity (unit + fuzz) y viem (roles, duplicados, pausa, eventos). Cobertura 100 %, reporte de gas con `gas-stats`.                                                      |
| API unitarias | `pnpm --filter @oasis/api test`       | Hash/canonicalización, transiciones del Recibo, login, utilidades.                                                                                                       |
| API e2e       | `pnpm --filter @oasis/api test:e2e`   | Flujo completo contra Hardhat local + escenarios de idempotencia con caída simulada del worker.                                                                          |
| SPA           | `pnpm --filter @oasis/web test`       | `api-client` (refresh y errores).                                                                                                                                        |
| SPA e2e       | `pnpm --filter @oasis/web test:e2e`   | Playwright: login → validar pago → ANCLADO → QR → verificación pública sin sesión. El webServer de Playwright levanta Hardhat, despliega, y arranca API + worker + Vite. |

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
  `hashRecibo` (`bytes32`), con sal aleatoria que nunca sale de PostgreSQL (ADR 0006).
- `OPERATOR_PRIVATE_KEY` **solo** existe en el contenedor `worker`; el esquema de entorno
  del API no la incluye (ADR 0004).
- `.env` ignorado por git; `.env.example` documenta todas las variables; ningún secreto
  se versiona.
- Contraseñas con argon2; JWT de acceso de 15 min; refresh de 7 días con rotación y
  detección de reutilización.
- Throttling, helmet, validación Zod de entradas y de entorno, filtro global de errores.

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
8. **Imagen `oasis-api-migrator`**: el runtime no incluye el CLI de Prisma; se publica una
   segunda imagen (mismo Dockerfile, target `migrator`) para la tarea `migrate`.

## Fases

- [x] **F0** Monorepo base (workspace, tooling, husky, commitlint).
- [x] **F1** `packages/shared` y `packages/contracts` (contrato, tests, ABI).
- [x] **F2** API base: config Zod, Prisma, auth, health, métricas, esqueleto hexagonal.
- [x] **F3** Walking skeleton e2e contra Hardhat local (+ idempotencia).
- [x] **F4** SPA: login, pagos, recibo con QR y verificación pública.
- [x] **F5** Docker: compose dev/prod/monitoring, Caddy, Grafana.
- [x] **F6** CI/CD, scripts, k6, docs C4, ADRs y despliegue.
