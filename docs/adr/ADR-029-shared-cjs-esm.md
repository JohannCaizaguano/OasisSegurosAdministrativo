# ADR-029 · `@oasis/shared` en CJS y ESM para el bundler

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S4 (Etapa C)

## Contexto

`@oasis/shared` se publicaba solo en CommonJS. La SPA lo importa a través de Vite, que no puede
eliminar código muerto de un `require('zod')`: el bundle cargaba zod entero (508 kB, con sus 65
archivos de idioma) aunque los esquemas usan una parte. Al medir la Etapa C, el chunk de la SPA
pesaba 1.299,58 kB (344,67 kB con gzip). El API es CommonJS (NestJS 11) y debe seguir cargando el
paquete con `require`.

## Decisión

- El build de `packages/shared` emite dos salidas: CommonJS en `dist/` (`tsconfig.json`) y ESM en
  `dist/esm/` (`tsconfig.esm.json`, con un `package.json` `{"type":"module"}` propio).
- `exports` declara la condición `module` → `dist/esm/index.js` antes de `default` →
  `dist/index.js`. Solo los bundlers leen `module`; Node la ignora, así que el API, el worker y Playwright siguen
  cargando CommonJS.
- Los tipos salen una sola vez (`dist/index.d.ts`); la salida ESM no emite declaraciones.

Resultado medido con `pnpm --filter @oasis/web build`: el chunk baja a 825,31 kB (253,05 kB con
gzip), un 36,5 % menos sin gzip y un 26,6 % menos con gzip.

## Alternativas descartadas

- **Solo ESM**: rompe el API, que es CommonJS y no puede subir a NestJS 12 (`CLAUDE.md`,
  «Trampas conocidas»).
- **Condición `import`**: Node ESM también la lee y no carga la salida de `tsc` con imports sin
  extensión.
- **Alias de Vite a `src/`**: la SPA compilaría el código fuente del paquete con otra
  configuración y dejaría de probar lo que consume el API.

## Consecuencias

- Positivas: la SPA hace tree-shaking de zod sin tocar el API ni los e2e; `@oasis/shared` sigue
  siendo un solo paquete con un solo `build`.
- Negativas: dos compilaciones por build y dos salidas que deben mantenerse equivalentes. El chunk
  sigue siendo único, sin división por rutas (deuda del informe de S4).
