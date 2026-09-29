import { config as cargarEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prisma 7 no carga .env automáticamente: se cargan apps/api/.env y, como
// respaldo, el .env raíz del monorepo.
cargarEnv({ path: ['.env', '../../.env'], quiet: true });

// `prisma generate` exige `datasource.url` aunque no conecte: se usa un
// placeholder para poder compilar en un clon limpio sin `.env`; los comandos
// que conectan reciben la URL real del entorno.
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
