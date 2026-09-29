# AGENTS.md — SRPP Oasis Seguros

Guía para agentes de IA que trabajen en este repositorio. Léela completa antes de
cambiar código.

## Proyecto

Sistema de Registro de Pagos de Primas (SRPP) del bróker **Oasis Seguros** (Quito,
Ecuador): clientes, pólizas, cuotas y pagos; cada pago validado emite un recibo digital
cuyo hash con sal se ancla en Polygon PoS (Amoy) y se puede verificar públicamente.
Es el proyecto de titulación de Ingeniería de Software de la ESPOCH: el código, la
documentación y las decisiones deben ser trazables y estar justificados.

## Fuente de verdad

`docs/referencia/` contiene los documentos que **mandan**: `PRODUCT_BACKLOG.md`
(historias, criterios de aceptación, DoD) y `ARQUITECTURA.md` (arc42 + C4). Si algo los
contradice, gana el documento y la contradicción se reporta. No se editan.

## Stack

Node.js 24 · pnpm 12 (workspaces) · TypeScript estricto · NestJS 11 · PostgreSQL 17 ·
Redis 7 (AOF) · Prisma 7 con `@prisma/adapter-pg` · Zod 4 · nestjs-pino · Jest +
Supertest · dependency-cruiser · ESLint flat + Prettier · husky + lint-staged +
commitlint · React 19 + Vite (SPA) · Hardhat 3 + Solidity (contrato).

## Estructura

```
apps/api          API + worker (hexagonal por módulo; ver src/modules/README.md)
apps/web          SPA (features/ por módulo de negocio)
packages/shared   esquemas Zod, constantes, tipos y ABI compartidos
packages/contracts RegistroRecibos.sol + tests + Ignition
infra/            monitoring/, k6/, scripts/     docs/adr/  docs/sprints/
```

## Comandos

```bash
pnpm install
pnpm dev:infra                 # PostgreSQL y Redis (docker compose, compose.dev.yaml)
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed  # idempotente
pnpm dev                       # API + worker + SPA
pnpm lint · pnpm format:check · pnpm typecheck · pnpm deps:check · pnpm test · pnpm build
pnpm test:e2e                  # requiere infraestructura arriba
```

## Convenciones

- **Idioma**: dominio, nombres de módulos, comentarios, mensajes de error y pruebas en
  español (`polizas`, `EstadoRecibo`); infraestructura técnica genérica en inglés
  (`ConfigService`). Commits: tipo en inglés, descripción en español.
- **Commits**: Conventional Commits con scopes `api`, `web`, `contracts`, `shared`,
  `infra`, `ci`, `docs`, `deps`, `repo`; commits pequeños, uno por unidad lógica.
- **Hexagonal**: cada módulo usa `domain/ application/{ports,use-cases}/
infrastructure/ presentation/http/`; puertos como interfaz + token `Symbol`; sin
  `process.env` fuera de `config/`; errores de dominio tipados (`shared-kernel/`).
- **DoD**: criterios de aceptación con prueba automatizada, `lint`, `typecheck`,
  `deps:check`, `test` y `build` en verde, y funciona con Docker Compose.

## Regla de alcance

Trabaja **solo** en las historias del sprint en curso; no adelantes trabajo de otro
sprint ni inventes funcionalidad sin uso. Lo que exceda el alcance se anota como deuda
en el informe, no se implementa.

## Decisiones

Toda decisión no trivial se registra como ADR corto en `docs/adr/` (IDs de la tabla
11-1 de la arquitectura; índice en `docs/adr/README.md`). Los informes de sprint viven
en `docs/sprints/`.
