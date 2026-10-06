# Oasis Seguros — Sistema web con anclaje blockchain

Monorepo del sistema administrativo del bróker de seguros **Oasis Seguros (Ecuador)**.
Un OPERADOR valida un pago, el sistema emite un recibo y su hash se ancla en
**Polygon PoS (testnet Amoy)** mediante el contrato `RegistroRecibos`. Solo el personal de
Oasis Seguros y sus clientes usan el sistema, siempre con inicio de sesión: el cliente verifica
sus recibos (código o QR) y paga sus cuotas en línea con PayPhone desde su portal (ADR-014 y
ADR-015). En la cadena no se expone ningún dato personal.

## Arquitectura en una mirada

- **Backend** (`apps/api`): NestJS 11 (CommonJS) con **arquitectura hexagonal** por
  módulo: `auth`, `usuarios`, `clientes`, `aseguradoras`, `polizas`, `pagos`, `recibos`
  (el "Módulo Blockchain") y `auditoria`. La regla de dependencias se verifica con dependency-cruiser.
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
  secuencia en Mermaid), `docs/adr` (15 ADR), `docs/sprints` y `docs/despliegue.md`.

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

## Desarrollo

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

| Suite         | Comando                                                                                                         | Qué cubre                                                                                                                                                                                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contratos     | `pnpm --filter @oasis/contracts test`                                                                           | 30 casos: Solidity (unit + fuzz, 18) y viem (roles, duplicados, pausa, eventos, 12).                                                                                                                                                                                                                                               |
| Contratos     | `pnpm --filter @oasis/contracts reporte`                                                                        | Verifica el umbral de cobertura y regenera `REPORTE-COBERTURA.md` y `REPORTE-GAS.md`. Falla si las líneas cubiertas bajan del 90 %.                                                                                                                                                                                                |
| Contratos     | `slither packages/contracts/contracts/RegistroRecibos.sol --config-file packages/contracts/slither.config.json` | Análisis estático con Slither 0.11.6 (`fail_on: medium`): 0 hallazgos. Job `slither` de CI.                                                                                                                                                                                                                                        |
| API unitarias | `pnpm --filter @oasis/api test`                                                                                 | 104 casos: hash y canonicalización, transiciones del Recibo, sesiones (login, refresco, cierre, estrategia JWT y fallo cerrado del adaptador), cambio de contraseña, acceso por rol (guard y descubrimiento/cobertura de rutas), la bitácora de auditoría y el módulo blockchain (outbox, idempotencia del anclaje, verificación). |
| API e2e       | `pnpm --filter @oasis/api test:e2e`                                                                             | Autenticación (sesiones por familia, renovación, revocación y cambio de contraseña), acceso por rol (matriz 401/403 y aislamiento de datos del CLIENTE), flujo de anclaje contra Hardhat local, idempotencia con caída simulada del worker y bitácora de auditoría.                                                                |
| SPA           | `pnpm --filter @oasis/web test`                                                                                 | 56 casos: `api-client` (401 → refresh → reintento, Web Locks, motivo `expirada`, contrato de error), esquemas compartidos de Zod, el diálogo de confirmación de pagos, la página Bitácora, el menú por rol, la página de contraseña, el aviso de inactividad y el login.                                                           |
| SPA e2e       | `pnpm --filter @oasis/web test:e2e`                                                                             | Playwright (Chromium): login → validar pago (con confirmación) → ANCLADO → QR → verificación con sesión; "atrás" tras cerrar sesión e inactividad a los 29/30 minutos con reloj falso. El webServer de Playwright levanta Hardhat, despliega y arranca API + worker + Vite.                                                        |

Los e2e (API y Playwright) son de pila completa: necesitan PostgreSQL, Redis, el nodo
Hardhat con el contrato desplegado y la API compilada (`pnpm -r build`); el job `web` de
CI no los ejecuta. Para correrlos: `pnpm dev:infra && pnpm dev:chain`, migración + seed,
`pnpm -r build`, `pnpm test:e2e` y `pnpm --filter @oasis/web test:e2e`.

**Cobertura de contratos**: el plugin de Hardhat 3 instrumenta líneas y sentencias, no
ramas ni funciones; `REPORTE-COBERTURA.md` solo afirma lo que mide y explica la
limitación (medir ramas exigiría migrar los tests a Foundry, fuera del stack acordado).

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
  servicio; ni `.env` ni el entorno del `api`/`migrate` la contienen (ADR-006).
- Contraseñas con argon2; access token de 15 min; refresh de 7 días con rotación y
  detección de reutilización; throttling, helmet, validación Zod de entradas y de
  entorno, y filtro global de errores.

## Variables de entorno

Las plantillas comentadas son la referencia: `.env.example` (API y worker) y
`.env.worker.example` (solo `OPERATOR_PRIVATE_KEY`). Valores destacados: `DATABASE_URL`
(host `postgres` dentro de Docker), secretos JWT de ≥ 32 caracteres, `CHAIN_ID`
(31337 local | 80002 Amoy | 137 Polygon), límites `THROTTLE_*` por IP/min y `DOMAIN`
(Caddy/TLS). En producción el seed se niega a usar las contraseñas por defecto.
