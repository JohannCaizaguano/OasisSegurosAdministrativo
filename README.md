# Oasis Seguros — Sistema web con anclaje blockchain

Monorepo del sistema administrativo del bróker de seguros **Oasis Seguros (Ecuador)**.
Un OPERADOR valida un pago, el sistema emite un recibo y su hash se ancla en
**Polygon PoS (testnet Amoy)** mediante el contrato `RegistroRecibos`. Cualquier persona
puede verificar un recibo desde una página pública, sin autenticación y sin exponer
datos personales.

> Trabajo de Titulación de Ingeniería de Software. Estado: **en construcción por fases (F0–F6)**.

## Arquitectura en una mirada

- **Backend** (`apps/api`): NestJS 12 en modo CommonJS con **arquitectura hexagonal**
  (puertos y adaptadores) por módulo de negocio: `auth`, `usuarios`, `clientes`,
  `polizas`, `pagos` y `recibos` (el "Módulo Blockchain").
- **Worker**: un segundo entrypoint (`worker.ts`) de la misma imagen; ejecuta el
  anclaje en cadena con firma custodial (la clave privada operadora vive **solo** aquí).
- **Integración blockchain**: patrón oráculo de salida _push-based_ + **Transactional
  Outbox** con BullMQ (cola `anclaje-recibos`, `jobId = reciboId`).
- **Frontend** (`apps/web`): SPA React 19 + Vite + Tailwind v4 + shadcn/ui, organizada
  por feature, con TanStack Query, React Hook Form y Zod.
- **Infraestructura**: contenedores `web` (Caddy), `api`, `worker`, `postgres`, `redis`
  y `migrate`; mismo origen (`/api/*` por reverse proxy) para evitar CORS en producción.
- Documentación C4, ADR y secuencia de anclaje en `docs/`.

## Estructura

```
apps/api         API + worker (NestJS, hexagonal, Prisma, BullMQ, viem)
apps/web         SPA (Vite, React 19, TanStack Query, shadcn/ui)
packages/shared  Esquemas Zod, constantes y tipos compartidos (API ⇄ web)
packages/contracts  Contrato Solidity + Hardhat 3 + Ignition + tests
infra/           Monitoreo, k6 y scripts de operación
docs/            Arquitectura (C4), ADRs y guía de despliegue
```

## Requisitos

- Node.js **24 LTS** (ver `.nvmrc`; el CI y las imágenes Docker usan Node 24).
- **pnpm** (ver nota de corepack abajo).
- Docker + Docker Compose (para Postgres, Redis y el nodo Hardhat local).
- Git.

```bash
nvm use            # Node 24
npm install -g pnpm@12   # o: npm install -g corepack && corepack enable
pnpm install
```

## Arranque rápido (desarrollo)

```bash
cp .env.example .env          # completar secretos locales
pnpm dev:infra                # postgres + redis + nodo Hardhat (Docker)
pnpm dev:chain                # despliega RegistroRecibos y escribe CONTRACT_ADDRESS
pnpm dev                      # API + worker + SPA con recarga en caliente
```

## Scripts raíz

| Script                                       | Descripción                                                         |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `pnpm build` / `lint` / `typecheck` / `test` | Ejecutan la tarea en todo el workspace (`pnpm -r`).                 |
| `pnpm format` / `format:check`               | Prettier sobre el monorepo.                                         |
| `pnpm dev`                                   | API, worker y web en modo desarrollo.                               |
| `pnpm dev:infra`                             | Postgres, Redis y nodo Hardhat vía `compose.dev.yaml`.              |
| `pnpm dev:chain`                             | Despliegue local (Ignition) + `REGISTRADOR_ROLE` + `apps/api/.env`. |
| `pnpm depcruise`                             | Verifica la regla de dependencias hexagonal (dependency-cruiser).   |

## Notas de fidelidad a la documentación oficial

Estas desviaciones respecto al enunciado se tomaron siguiendo la documentación oficial
vigente de cada herramienta:

1. **TypeScript**: la última estable es 7.x (compilador nativo), pero `typescript-eslint`
   (peer `<6.1.0`) y `ts-jest` (peer `<7`) aún **no la soportan**. Se usa la última 5.x
   estable. Se reevaluará cuando el ecosistema publique soporte.
2. **Prisma**: el dist-tag `latest` de `prisma` apunta a un _release candidate_ (8.0.0-rc);
   se usa la **última estable 7.10.0** (etiqueta `prev`) junto con `@prisma/client@7.10.0`.
3. **Corepack**: Node.js ≥ 25 ya no incluye corepack. Se fija la versión con el campo
   `packageManager` y se recomienda `npm i -g pnpm@12` (o instalar corepack por separado).
4. **pnpm ≥ 10** bloquea los scripts de instalación de dependencias nativas; se declaran
   en `onlyBuiltDependencies` dentro de `pnpm-workspace.yaml`.

## Seguridad

- Ningún dato personal se escribe en la blockchain: solo un identificador opaco
  (`bytes32`) y un hash con sal (`bytes32`).
- `.env` está ignorado por git; `.env.example` documenta todas las variables.
- La clave privada operadora (`OPERATOR_PRIVATE_KEY`) **solo** la lee el contenedor
  `worker`; el API únicamente realiza lecturas (`eth_call`).

## Fases de construcción

- [x] **F0** Monorepo base (tooling, husky, commitlint).
- [ ] **F1** `packages/shared` y `packages/contracts` (contrato + tests + ABI).
- [ ] **F2** API base: config Zod, Prisma, auth, health, métricas, esqueleto hexagonal.
- [ ] **F3** Walking skeleton e2e contra Hardhat local (+ idempotencia).
- [ ] **F4** SPA: login, pagos, recibo con QR y verificación pública.
- [ ] **F5** Docker: compose dev/prod/monitoring, Caddy.
- [ ] **F6** CI/CD, scripts, k6, docs C4, ADRs y despliegue.
