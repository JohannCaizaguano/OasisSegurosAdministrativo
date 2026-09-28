import { config as cargarEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 no carga .env automáticamente: se cargan apps/api/.env y, como
// respaldo, el .env raíz del monorepo.
cargarEnv({ path: ['.env', '../../.env'], quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
