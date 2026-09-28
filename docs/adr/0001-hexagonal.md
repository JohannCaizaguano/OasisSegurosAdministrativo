# ADR 0001 · Arquitectura hexagonal por módulo de negocio

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

El backend cubre cuatro módulos de negocio (clientes, pólizas, pagos y recibos — este
último con integración blockchain). Es un trabajo de titulación: la evaluación valora
arquitectura explícita, verificabilidad y bajo acoplamiento a frameworks. El enunciado
exige que `domain` no dependa de NestJS/Prisma/viem/BullMQ y que `application` dependa
solo del dominio y de sus puertos.

## Decisión

Aplicar puertos y adaptadores (hexagonal) dentro de cada módulo:

- `domain`: entidades, value objects y errores de negocio en TypeScript puro.
- `application/ports`: interfaces + token `Symbol` para inyección.
- `application/use-cases`: orquestan dominio y puertos; sin decoradores de NestJS.
- `infrastructure`: adaptadores Prisma, viem, BullMQ, Redis.
- `presentation`: controladores NestJS que dependen solo de casos de uso.
- Composición explícita en `*.module.ts` con `useFactory` e `inject` por token.

La regla se verifica automáticamente con **dependency-cruiser** (`pnpm depcruise`), que
falla el CI si `domain` importa un framework, si `application` importa `infrastructure` o
si `presentation` importa un adaptador. La configuración fija `baseDir` y ancla el patrón
de exclusión a `^(dist|build|src/generated)`: sin ese anclaje, `dist` también coincidía con
las rutas resueltas de paquetes de `node_modules` y los puntos de entrada de
`@nestjs/bullmq`, `bullmq`, `nestjs-pino` y `@oasis/shared` quedaban fuera del grafo, con
lo que las reglas no podían detectarlos.

`domain` **sí** puede importar los tipos de dominio compartidos de `@oasis/shared`
(`Rol`, `EstadoPago`, `MetodoPago`, `EstadoRecibo`…): son uniones de literales sin
dependencias y son la fuente de verdad compartida con el frontend. La prohibición real es
la de los frameworks de la capa interna (NestJS, Prisma, viem, BullMQ, ioredis, prom-client).

## Alternativas descartadas

- **NestJS "de fábrica" (services inyectables por clase)**: rápido, pero el dominio y la
  aplicación quedan acoplados a decoradores y al contenedor; imposible de verificar por
  reglas estáticas.
- **Arquitectura por capas técnicas globales** (`controllers/`, `services/`, `entities/`):
  dificulta el aislamiento por módulo y favorece dependencias cruzadas.
- **Clean Architecture con 4 capas globales**: equivalente, pero el enunciado pide
  organizar por módulo de negocio.

## Consecuencias

- Positivas: tests de dominio sin infraestructura; dependencias explícitas y auditables;
  adaptadores intercambiables; la regla es CI-enforced.
- Negativas: más archivos y "ceremonia" (interfaces, tokens, factories); la composición
  manual en módulos es más verbosa que `@Injectable` por clase.
