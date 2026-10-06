# AGENTS.md — SRPP Oasis Seguros

Guía para agentes de IA que trabajen en este repositorio. Léela completa antes de
cambiar código. Lee también `CLAUDE.md` (mapa técnico) y `apps/api/src/modules/README.md`
(reglas de los módulos del API).

## Proyecto

Sistema de Registro de Pagos de Primas (SRPP) del bróker **Oasis Seguros** (Quito,
Ecuador): clientes, pólizas, cuotas y pagos; cada pago validado emite un recibo digital
cuyo hash con sal se ancla en Polygon PoS (Amoy). Solo el personal y los clientes de Oasis
usan el sistema, con inicio de sesión: el cliente verifica sus recibos y paga sus cuotas en
línea con PayPhone (ADR-014 y ADR-015). Las aseguradoras son datos, no usuarias.
Es el proyecto de titulación de Ingeniería de Software de la ESPOCH: el código, la
documentación y las decisiones deben ser trazables y estar justificados.

## Fuente de verdad

`docs/referencia/` contiene los documentos que **mandan**: `PRODUCT_BACKLOG.md`
(historias, criterios de aceptación, DoD) y `ARQUITECTURA.md` (arc42 + C4). Si algo los
contradice, gana el documento y la contradicción se reporta. No se editan.

## Stack

Node.js 24 (`.nvmrc`) · pnpm 12 (workspaces) · TypeScript estricto · NestJS 11 ·
PostgreSQL 17 · Redis 7 (AOF) · Prisma 7 con `@prisma/adapter-pg` · Zod 4 · nestjs-pino ·
Jest + Supertest · Vitest + Playwright · dependency-cruiser · ESLint flat + Prettier ·
husky + lint-staged + commitlint · React 19 + Vite (SPA) · Hardhat 3 + Solidity (contrato).

## Estructura

```
apps/api          API + worker (hexagonal por módulo; reglas en src/modules/README.md)
apps/web          SPA (features/ por módulo de negocio)
packages/shared   esquemas Zod, constantes, tipos y ABI (generado desde el contrato)
packages/contracts RegistroRecibos.sol + tests + Ignition
infra/            monitoring/, k6/, scripts/     docs/adr/  docs/sprints/
```

## Puesta en marcha

```bash
pnpm install
cp .env.example apps/api/.env          # completar secretos locales
pnpm dev:infra                         # PostgreSQL, Redis y nodo Hardhat (compose.dev.yaml)
pnpm dev:chain                         # despliega el contrato, otorga rol y escribe apps/api/.env
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed          # idempotente
pnpm dev                               # API + worker + SPA
```

- SPA en http://localhost:5173 · API en http://localhost:3000/api/v1 · Swagger en `/api/docs`.
- En un clon limpio, `pnpm -r build` antes de `typecheck` o e2e: el build genera el cliente
  de Prisma y los tipos de viem. `pnpm dev:chain` necesita el nodo Hardhat de `dev:infra`.

## Pruebas

- Monorepo: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
  `pnpm deps:check` (regla hexagonal, solo `apps/api`).
- Un solo test (el filtro va directo, **sin** `--`):
  - API: `pnpm --filter @oasis/api test <patrón>`; e2e: `pnpm --filter @oasis/api test:e2e`.
  - SPA: `pnpm --filter @oasis/web test <ruta>`; e2e: `pnpm --filter @oasis/web test:e2e`.
  - Contratos: `pnpm --filter @oasis/contracts test` (`test:solidity` | `test:nodejs`).
- `pnpm test:e2e` (raíz) corre **solo** los e2e del API; Playwright va aparte. Ambos exigen
  infraestructura arriba, `pnpm dev:chain`, migración + seed y `pnpm -r build`.

## Skills por tecnología

Antes de tocar una tecnología, invoca su skill con la herramienta `skill`; no improvises
convenciones que la skill ya define.

| Tarea                                        | Skill                                                   |
| -------------------------------------------- | ------------------------------------------------------- |
| API NestJS (módulos, DI, guards, pipes, e2e) | `nestjs-best-practices`                                 |
| Node.js (async, errores, backend)            | `nodejs-best-practices`, `nodejs-backend-patterns`      |
| Prisma (schema, migraciones, CLI)            | `prisma-cli`, `prisma-database-setup`                   |
| Prisma (consultas y cliente)                 | `prisma-client-api`                                     |
| PostgreSQL / Prisma Postgres                 | `prisma-postgres`                                       |
| Zod (esquemas y validación)                  | `zod`                                                   |
| TypeScript avanzado (generics, tipos)        | `typescript-advanced-types`                             |
| React (componentes, hooks, performance)      | `react-best-practices`                                  |
| Composición de componentes                   | `composition-patterns`                                  |
| Formularios                                  | `react-hook-form`                                       |
| Tailwind v4 + shadcn/ui                      | `tailwind-css-patterns`, `tailwind-v4-shadcn`, `shadcn` |
| Vite                                         | `vite`                                                  |
| Vitest (unitarias SPA)                       | `vitest`                                                |
| Playwright (e2e SPA)                         | `playwright-best-practices`                             |
| UI, diseño y pulido visual                   | `impeccable` (+ `frontend-design` si es UI nueva)       |
| Accesibilidad                                | `accessibility`                                         |
| Scripts bash (infra)                         | `bash-defensive-patterns`                               |

## Proceso

- **Superpowers** antes de actuar: `brainstorming` para features o diseño nuevo,
  `systematic-debugging` ante bugs, `test-driven-development` para implementar,
  `verification-before-completion` antes de declarar algo terminado, y
  `writing-plans`/`executing-plans` para trabajo de varios pasos.
- **Ponytail** siempre activo: YAGNI, stdlib o nativo antes que dependencias, el diff más
  corto que funcione, sin abstracciones con una sola implementación. Las simplificaciones
  deliberadas se marcan con un comentario `ponytail:` que nombre el techo y la salida.
  Para auditar: `ponytail-review` (diff) y `ponytail-audit` (repo completo).
- **Impeccable** para cualquier trabajo de UI (crear, auditar, pulir).
- Orden: skill de proceso → skill de la tecnología → ponytail decide el tamaño.

## Convenciones

- **Idioma**: dominio, nombres de módulos, comentarios, mensajes de error y pruebas en
  español (`polizas`, `EstadoRecibo`); infraestructura técnica genérica en inglés
  (`ConfigService`). Commits: tipo en inglés, descripción en español.
- **Nombres**:

  | Elemento                          | Convención                                                            |
  | --------------------------------- | --------------------------------------------------------------------- |
  | Variables, funciones, parámetros  | `camelCase`                                                           |
  | Tipos, clases, enums, componentes | `PascalCase`                                                          |
  | Constantes de módulo              | `UPPER_SNAKE_CASE`                                                    |
  | Booleanos                         | `es*` / `esta*` / `puede*` / `tiene*`                                 |
  | Archivos                          | `kebab-case`; componentes propios `.tsx` en `PascalCase`              |
  | Excepciones de archivo            | `components/ui/` (shadcn) y wiring (`router.tsx`) siguen `kebab-case` |
  | Prisma                            | modelos `PascalCase` singular, campos `camelCase`                     |
  | Esquemas Zod / puertos            | `xxxSchema` / `XxxPort` + token `XXX`                                 |
  | Pruebas                           | `*.spec.ts` / `*.test.tsx`                                            |

- **Commits**: Conventional Commits con scopes `api`, `web`, `contracts`, `shared`,
  `infra`, `ci`, `docs`, `deps`, `repo`; descripción en español. **Pocos commits**: agrupa
  el trabajo completo de una tarea o sesión en un solo commit, aunque toque varios
  paquetes; no hagas micro-commits. Commitlint también admite `docker` y `release`, con
  encabezados de hasta 100 caracteres, y el hook `pre-commit` corre Prettier y ESLint con
  `--fix` mediante lint-staged.
- **Acceso y auditoría**: todo handler declara `@Roles(...)` o `@Public()`, y toda mutación
  `@Auditar(accion, entidad)`; las rutas públicas y las exenciones están en
  `apps/api/src/modules/README.md`.
- **SPA**: una página nueva se registra en `router.tsx` con sus roles y se enlaza desde el menú
  lateral de `AppLayout`; las páginas de la cuenta del usuario, desde su menú en el encabezado.
- **Hexagonal**: cada módulo usa `domain/ application/{ports,use-cases}/
infrastructure/ presentation/http/`; puertos como interfaz + token `Symbol`; sin
  `process.env` fuera de `config/`; errores de dominio tipados (`shared-kernel/`).
- **ABI**: `packages/shared/src/abi/` se genera; tras tocar el contrato ejecuta
  `pnpm --filter @oasis/contracts export-abi` y versiona el diff (CI falla si deriva).
- **Secretos**: `OPERATOR_PRIVATE_KEY` solo en `.env.worker` en producción (ADR-006); en
  desarrollo la escribe `pnpm dev:chain` en `apps/api/.env`. No la añadas al `.env` raíz ni
  al esquema de entorno del API.
- **DoD**: criterios de aceptación con prueba automatizada, `lint`, `typecheck`,
  `deps:check`, `test` y `build` en verde, y funciona con Docker Compose.

## Comentarios y documentación

- Comentarios solo para el **porqué no obvio**, máximo 1-2 líneas. Prohibido narrar
  cambios o historia ("antes…", "se corrigió…", "sin esto…"), repetir lo que dice el
  código o comentar el proceso de la sesión.
- JSDoc solo para contratos públicos; NatSpec obligatorio en Solidity.
- Documentación solo en `docs/`; ADRs cortos (Contexto · Decisión · Alternativas ·
  Consecuencias); lo que ya está en otro documento se enlaza, no se repite; no crear
  documentos nuevos sin pedirlo.

## Buenas prácticas

- **Tipos**: prohibido `any` (usa `unknown` + narrowing); sin `!` fuera de tests.
- **Errores y async**: errores de dominio tipados, sin `catch` vacíos ni promesas
  flotantes (usa `void` si el olvido es intencional).
- **Pruebas**: TDD para lógica nueva; nombres de test en español describiendo
  comportamiento.
- **Accesibilidad**: labels, roles y navegación por teclado en toda UI nueva.
- **Rendimiento**: evita N+1 (Prisma `include`); no optimices ni memorices sin medir.
- **Imports**: alias `@/` en la SPA; sin dependencias circulares.

## Regla de alcance

Trabaja **solo** en las historias del sprint en curso; no adelantes trabajo de otro
sprint ni inventes funcionalidad sin uso. Lo que exceda el alcance se anota como deuda
en el informe, no se implementa.

## Decisiones

Toda decisión no trivial se registra como ADR corto en `docs/adr/` (IDs de la tabla
11-1 de la arquitectura; un ADR nuevo toma el número siguiente y el informe del sprint
pide al autor agregarlo a la tabla; índice en `docs/adr/README.md`). Los informes de sprint
viven en `docs/sprints/`.
