import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { artifacts } from 'hardhat';

const aquí = dirname(fileURLToPath(import.meta.url));
const destino = resolve(aquí, '../../shared/src/abi/registroRecibos.ts');

const artifact = await artifacts.readArtifact('RegistroRecibos');

const encabezado = [
  '// Archivo GENERADO automáticamente por packages/contracts/scripts/export-abi.ts.',
  '// No editar a mano: volver a ejecutar `pnpm --filter @oasis/contracts export-abi`.',
  '',
  'export const registroRecibosAbi = ',
].join('\n');

const contenido = `${encabezado}${JSON.stringify(artifact.abi, null, 2)} as const;\n\nexport type RegistroRecibosAbi = typeof registroRecibosAbi;\n`;

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, contenido, 'utf8');

console.log(`ABI exportado a ${destino} (${artifact.abi.length} entradas)`);
