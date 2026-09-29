/**
 * Regla de dependencias de la arquitectura hexagonal (ver docs/adr/ADR-002-arquitectura-hexagonal.md).
 *
 *   domain         -> no conoce Nest, Prisma, viem, BullMQ ni ioredis
 *   application    -> solo domain, sus puertos y utilidades puras
 *   infrastructure -> implementa puertos (puede usar cualquier dependencia)
 *   presentation   -> usa application, nunca infrastructure directamente
 *
 * Nota sobre `@oasis/shared`: el dominio SÍ puede importar los tipos de
 * dominio compartidos (Rol, EstadoPago, MetodoPago, ...). Son uniones de
 * literales sin dependencias y son la fuente de verdad compartida con el
 * frontend. La prohibición real es la de los frameworks de la capa interna.
 *
 * Los patrones usan rutas relativas al `baseDir` declarado abajo, de modo que
 * las reglas siguen funcionando aunque se ejecute desde otro directorio.
 */
const FRAMEWORKS =
  'node_modules/(@nestjs|@prisma|prisma|viem|bullmq|ioredis|prom-client|nestjs-pino|argon2|helmet|@willsoto)';

module.exports = {
  forbidden: [
    {
      name: 'domain-sin-frameworks',
      severity: 'error',
      comment:
        'El dominio debe ser TypeScript puro: sin NestJS, Prisma, viem, BullMQ, ioredis ni prom-client.',
      from: { path: ['^src/modules/[^/]+/domain', '^src/shared-kernel/'] },
      to: { path: FRAMEWORKS },
    },
    {
      name: 'domain-sin-otras-capas',
      severity: 'error',
      from: { path: ['^src/modules/[^/]+/domain', '^src/shared-kernel/'] },
      to: {
        path: [
          '^src/modules/[^/]+/(application|infrastructure|presentation)',
          '^src/infrastructure',
          '^src/common',
          '^src/config',
        ],
      },
    },
    {
      name: 'application-sin-frameworks',
      severity: 'error',
      comment: 'Los casos de uso no conocen frameworks; solo dominio, puertos y librerías puras.',
      from: { path: '^src/modules/[^/]+/application' },
      to: { path: FRAMEWORKS },
    },
    {
      name: 'application-sin-infraestructura',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application' },
      to: {
        path: [
          '^src/modules/[^/]+/(infrastructure|presentation)',
          '^src/infrastructure',
          '^src/common',
        ],
      },
    },
    {
      name: 'presentation-sin-infraestructura',
      severity: 'error',
      comment: 'Los controllers consumen casos de uso a través de tokens, no adaptadores.',
      from: { path: '^src/modules/[^/]+/presentation' },
      to: {
        path: ['^src/modules/[^/]+/infrastructure', '^src/infrastructure'],
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    // Sin `baseDir`, las rutas se resuelven contra el directorio de trabajo y
    // todas las reglas quedan inertes al ejecutar depcruise desde la raíz.
    baseDir: __dirname,
    doNotFollow: { path: '(^|/)node_modules' },
    // Anclado a `^`: sin anclar, `dist` también coincide con las rutas
    // resueltas de paquetes de node_modules (`.../node_modules/x/dist/index.js`)
    // y las reglas no podrían detectar sus entradas.
    exclude: { path: '^(dist|build|src/generated)' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['require', 'node', 'default'],
    },
  },
};
