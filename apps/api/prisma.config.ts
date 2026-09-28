import { config as cargarEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prisma 7 no carga .env automáticamente: se cargan apps/api/.env y, como
// respaldo, el .env raíz del monorepo.
cargarEnv({ path: ['.env', '../../.env'], quiet: true });

// `prisma generate` no necesita una base de datos real, pero Prisma 7 exige que
// `datasource.url` esté definido para resolver el schema. Por eso se usa un
// placeholder en lugar de `env('DATABASE_URL')`, que abortaría el generate (y
// con él `pnpm build` y CI) cuando no hay .env — requisito para poder compilar
// el monorepo en un clon limpio. Los comandos que sí conectan (migrate, db
// seed, studio) reciben la URL real desde el entorno.
const urlGenerate = process.env['DATABASE_URL'] ?? 'postgresql://oasis:oasis@localhost:5432/oasis';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: urlGenerate,
  },
});
