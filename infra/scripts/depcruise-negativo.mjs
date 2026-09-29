// Prueba negativa de la regla hexagonal (ADR-002).
//
// Crea un archivo temporal en un `domain/` que importa infraestructura, corre
// `deps:check` y verifica que FALLE; después elimina el archivo. Sirve como
// evidencia reproducible de que la regla no es decorativa.
//
// Uso: pnpm deps:check:negativo
import { spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const archivoTemporal = resolve(
  raiz,
  'apps/api/src/modules/clientes/domain/__prueba-negativa-depcruise.ts',
);

const contenido = [
  '// Archivo temporal de la prueba negativa: el dominio NO puede importar infraestructura.',
  "import { PrismaService } from '../../../infrastructure/prisma/prisma.service';",
  '',
  'export const pruebaNegativa = PrismaService;',
  '',
].join('\n');

writeFileSync(archivoTemporal, contenido, 'utf8');
try {
  const resultado = spawnSync('pnpm --filter @oasis/api deps:check', {
    cwd: raiz,
    stdio: 'inherit',
    shell: true,
  });

  if (resultado.status === 0) {
    console.error(
      '\n✖ FALLO: dependency-cruiser NO detectó la violación del dominio. Revisa .dependency-cruiser.cjs.',
    );
    process.exitCode = 1;
  } else {
    console.log(
      '\n✔ OK: dependency-cruiser rechazó la importación de infraestructura desde el dominio.',
    );
  }
} finally {
  rmSync(archivoTemporal, { force: true });
}
