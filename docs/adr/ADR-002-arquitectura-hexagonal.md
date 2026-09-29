# ADR-002 · Arquitectura hexagonal por módulo de negocio

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

El backend cubre cuatro módulos de negocio (clientes, pólizas, pagos y recibos — este
último con integración blockchain). La evaluación valora arquitectura explícita,
verificabilidad y bajo acoplamiento a frameworks: `domain` no puede depender de
NestJS/Prisma/viem/BullMQ y `application` solo del dominio y de sus puertos.

## Decisión

Aplicar puertos y adaptadores (hexagonal) dentro de cada módulo:

- `domain`: entidades, value objects y errores de negocio en TypeScript puro.
- `application/ports`: interfaces + token `Symbol` para inyección.
- `application/use-cases`: orquestan dominio y puertos; sin decoradores de NestJS.
- `infrastructure`: adaptadores Prisma, viem, BullMQ, Redis.
- `presentation`: controladores NestJS que dependen solo de casos de uso.
- Composición explícita en `*.module.ts` con `useFactory` e `inject` por token.

**dependency-cruiser** (`pnpm deps:check`) falla el CI si `domain` importa un framework,
si `application` importa `infrastructure` o si `presentation` importa un adaptador. La
configuración fija `baseDir` y ancla la exclusión a `^(dist|build|src/generated)` para
que los puntos de entrada de `node_modules` entren al grafo.

`domain` **sí** puede importar los tipos de dominio de `@oasis/shared` (`Rol`,
`EstadoPago`, `MetodoPago`, `EstadoRecibo`…): son uniones de literales sin dependencias y
la fuente de verdad compartida con el frontend. La prohibición real es la de los
frameworks de la capa interna.

## Alternativas descartadas

- **NestJS "de fábrica" (services inyectables por clase)**: rápido, pero acopla dominio y
  aplicación a decoradores y al contenedor; imposible de verificar por reglas estáticas.
- **Capas técnicas globales** (`controllers/`, `services/`, `entities/`): dificulta el
  aislamiento por módulo y favorece dependencias cruzadas.
- **Clean Architecture con 4 capas globales**: equivalente, pero el enunciado pide
  organizar por módulo de negocio.

## Consecuencias

- Positivas: tests de dominio sin infraestructura; dependencias explícitas y auditables;
  adaptadores intercambiables; la regla es CI-enforced.
- Negativas: más archivos y "ceremonia" (interfaces, tokens, factories); la composición
  manual es más verbosa que `@Injectable` por clase.
