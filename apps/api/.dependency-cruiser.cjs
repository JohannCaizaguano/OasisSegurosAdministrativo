/**
 * Regla de dependencias de la arquitectura hexagonal (ver docs/adr/0001-hexagonal.md).
 *   domain         -> no conoce Nest, Prisma, viem, BullMQ ni ioredis
 *   application    -> solo domain, sus puertos y utilidades puras
 *   infrastructure -> implementa puertos (puede usar cualquier dependencia)
 *   presentation   -> usa application, nunca infrastructure directamente
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-sin-frameworks',
      severity: 'error',
      comment:
        'El dominio debe ser TypeScript puro: sin NestJS, Prisma, viem, BullMQ, ioredis ni prom-client.',
      from: { path: '^src/(modules/[^/]+|shared-kernel)/domain' },
      to: {
        path: 'node_modules/(@nestjs|@prisma|prisma|viem|bullmq|ioredis|prom-client|nestjs-pino|argon2|helmet)',
      },
    },
    {
      name: 'domain-sin-otras-capas',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+|shared-kernel)/domain' },
      to: {
        path: '^src/(modules/[^/]+/(application|infrastructure|presentation)|infrastructure|common|config)',
      },
    },
    {
      name: 'domain-sin-shared-abi',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain' },
      to: { path: '@oasis/shared' },
    },
    {
      name: 'application-sin-frameworks',
      severity: 'error',
      comment: 'Los casos de uso no conocen frameworks; solo dominio, puertos y librerías puras.',
      from: { path: '^src/modules/[^/]+/application' },
      to: {
        path: 'node_modules/(@nestjs|@prisma|prisma|viem|bullmq|ioredis|prom-client|nestjs-pino|argon2|helmet)',
      },
    },
    {
      name: 'application-sin-infraestructura',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+)/application' },
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
      to: { path: '^src/modules/[^/]+/infrastructure' },
    },
    {
      name: 'shared-kernel-sin-frameworks',
      severity: 'error',
      from: { path: '^src/shared-kernel' },
      to: {
        path: 'node_modules/(@nestjs|@prisma|prisma|viem|bullmq|ioredis|prom-client|nestjs-pino)',
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
    doNotFollow: { path: '(^|/)node_modules' },
    exclude: { path: 'dist|src/generated' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['require', 'node', 'default'],
    },
  },
};
