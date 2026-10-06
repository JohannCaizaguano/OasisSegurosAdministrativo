# Oasis Seguros — Sistema web con anclaje blockchain

Monorepo del sistema administrativo del bróker de seguros **Oasis Seguros (Ecuador)**.
Un OPERADOR valida un pago, el sistema emite un recibo y su hash se ancla en
**Polygon PoS (testnet Amoy)** mediante el contrato `RegistroRecibos`. Solo el personal de
Oasis Seguros y sus clientes usan el sistema, siempre con inicio de sesión: el cliente verifica
sus recibos (código o QR) y paga sus cuotas en línea con PayPhone desde su portal (ADR-014 y
ADR-015). En la cadena no se expone ningún dato personal.

## Arquitectura

- **Backend** (`apps/api`): NestJS 11 (CommonJS) con **arquitectura hexagonal** por
  módulo: `auth`, `usuarios`, `clientes`, `aseguradoras`, `polizas`, `pagos`, `recibos`
  (el "Módulo Blockchain") y `auditoria`. La regla de dependencias se verifica con dependency-cruiser.
- **Worker**: segundo entrypoint de la misma imagen y único contenedor con la clave
  operadora (ADR-006). Procesa la cola `anclaje-recibos` con concurrencia 1 y reencola cada
  30 s los recibos pendientes.
- **Integración blockchain**: oráculo de salida _push-based_ con outbox transaccional
  (ADR-005). El hash del recibo es `keccak256(sal ‖ payloadCanónico RFC 8785)` y el
  `idOnchain` es `keccak256(uuid)`; en la cadena solo se guardan esos dos `bytes32` (ADR-004).
- **Frontend** (`apps/web`): SPA React 19 + Vite + Tailwind v4 + componentes shadcn/ui,
  por feature, con TanStack Query y React Hook Form + Zod reutilizando `packages/shared`.
- **Infraestructura**: Caddy (SPA + reverse proxy `/api/*`, TLS automático), PostgreSQL
  17, Redis 7, Prisma 7 con driver adapter `pg` y BullMQ. SPA y API comparten origen, así que
  no hay CORS; el refresh token viaja en una cookie `httpOnly`, `Secure` y `SameSite=Strict`.
- **Medición**: `/metrics` (prom-client) solo en la red interna, con un stack opcional de
  Prometheus, Grafana, cAdvisor y node-exporter.
- **Documentación**: `docs/referencia` (fuente de verdad), `docs/arquitectura` (C4 y
  secuencia en Mermaid), `docs/adr`, `docs/sprints` y `docs/despliegue.md`.

## Estructura

```
apps/api              API + worker (NestJS, hexagonal, Prisma, BullMQ, viem)
apps/web              SPA (Vite, React 19, shadcn/ui)
packages/shared       Esquemas Zod, constantes, tipos y ABI (generado)
packages/contracts    RegistroRecibos.sol + Hardhat 3 + Ignition + tests
infra/                monitoring/, k6/ y scripts/ (bootstrap, backup, restore, deploy)
docs/                 referencia/, arquitectura/, adr/, sprints/, despliegue.md
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

`pnpm --filter @oasis/api build` (y el `build` raíz) ejecuta `prisma generate`; el seed
necesita ese cliente generado.

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

| Suite         | Comando                                                                                                         | Qué cubre                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contratos     | `pnpm --filter @oasis/contracts test`                                                                           | 30 casos: Solidity (unit + fuzz, 18) y viem (roles, duplicados, pausa, eventos, 12).                                                                                                                                                                                                                                                                                                                                                      |
| Contratos     | `pnpm --filter @oasis/contracts reporte`                                                                        | Verifica el umbral de cobertura y regenera `REPORTE-COBERTURA.md` y `REPORTE-GAS.md`. Falla si las líneas cubiertas bajan del 90 %.                                                                                                                                                                                                                                                                                                       |
| Contratos     | `slither packages/contracts/contracts/RegistroRecibos.sol --config-file packages/contracts/slither.config.json` | Análisis estático con Slither 0.11.6 (`fail_on: medium`): 0 hallazgos. Job `slither` de CI.                                                                                                                                                                                                                                                                                                                                               |
| API unitarias | `pnpm --filter @oasis/api test`                                                                                 | 131 casos: hash y canonicalización, transiciones del Recibo, sesiones (login, refresco, cierre, estrategia JWT y fallo cerrado del adaptador), cambio de contraseña, acceso por rol (guard y descubrimiento/cobertura de rutas), usuarios del personal (temporal, cierre de sesiones, último ADMIN), clientes y aseguradoras con RN-11, la bitácora de auditoría y el módulo blockchain (outbox, idempotencia del anclaje, verificación). |
| API e2e       | `pnpm --filter @oasis/api test:e2e`                                                                             | Autenticación (sesiones por familia, renovación, revocación y cambio de contraseña), acceso por rol (matriz 401/403 y aislamiento de datos del CLIENTE), usuarios del personal (alta, desactivar/reactivar/restablecer, último ADMIN), clientes con RN-11 y aseguradoras, flujo de anclaje contra Hardhat local, idempotencia con caída simulada del worker y bitácora de auditoría.                                                      |
| SPA           | `pnpm --filter @oasis/web test`                                                                                 | 97 casos: `api-client` (401 → refresh → reintento, Web Locks, motivo `expirada`, contrato de error), esquemas compartidos de Zod y RN-11, el diálogo de confirmación de pagos, las páginas Bitácora, Usuarios, Aseguradoras y Clientes, la tabla paginada, el menú por rol, la página de contraseña, el aviso de inactividad y el login.                                                                                                  |
| SPA e2e       | `pnpm --filter @oasis/web test:e2e`                                                                             | Playwright (Chromium): login → validar pago (con confirmación) → ANCLADO → QR → verificación con sesión; personal en dos contextos (temporal, duplicado en el campo, desactivación); 360 px por rol; "atrás" tras cerrar sesión e inactividad a los 29/30 minutos con reloj falso. El webServer de Playwright levanta Hardhat, despliega y arranca API + worker + Vite.                                                                   |

Los e2e del API y de Playwright necesitan PostgreSQL, Redis, el nodo Hardhat con el contrato
desplegado y el monorepo compilado. El CI corre los del API; los de Playwright, no. Para
correrlos: `pnpm dev:infra && pnpm dev:chain`, migración y seed, `pnpm -r build`,
`pnpm test:e2e` y `pnpm --filter @oasis/web test:e2e`.

**Cobertura de contratos**: el plugin de Hardhat 3 mide líneas y sentencias, no ramas ni
funciones. Medir ramas exigiría migrar las pruebas a Foundry, que no está en el stack.

## Producción

`docs/despliegue.md` cubre el VPS (Ubuntu 24.04 en OVHcloud), TLS con Caddy, el
endurecimiento del servidor, los backups con rotación de 7 días, el despliegue del contrato en
Amoy con `hardhat-keystore` y su verificación con Etherscan V2.

```bash
docker compose -f compose.prod.yaml up -d
docker compose -f compose.prod.yaml -f compose.monitoring.yaml up -d   # evaluación
```

## Seguridad

- En la blockchain no se escriben datos personales ni montos: solo `idOnchain` y
  `hashRecibo` (`bytes32`). La sal de cada hash vive solo en PostgreSQL (ADR-004).
- `OPERATOR_PRIVATE_KEY` está solo en `.env.worker` (plantilla en `.env.worker.example`), que
  `compose.prod.yaml` inyecta únicamente en el `worker` (ADR-006).
- Contraseñas con argon2id; access token de 15 min; sesiones en Redis con cierre por 30 min de
  inactividad y refresh de 7 días como máximo, rotado en cada uso (ADR-016). Además: límites
  por IP, helmet, validación Zod de entradas y del entorno, y un filtro global de errores.

## Variables de entorno

Las plantillas son `.env.example` (API y worker) y `.env.worker.example` (solo
`OPERATOR_PRIVATE_KEY`); cada variable está comentada ahí. Las principales: `DATABASE_URL`
(host `postgres` dentro de Docker), secretos JWT de 32 caracteres o más, `CHAIN_ID` (31337
local, 80002 Amoy, 137 Polygon), límites `THROTTLE_*` por IP y minuto, y `DOMAIN` (Caddy). En
producción el seed rechaza las contraseñas por defecto.
