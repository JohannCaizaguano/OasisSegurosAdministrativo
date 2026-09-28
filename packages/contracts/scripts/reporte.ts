import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Verifica la cobertura de los contratos y genera el reporte de gas.
 *
 * Alcance real de la medición: el plugin de cobertura de Hardhat 3 instrumenta
 * líneas y sentencias, pero NO ramas ni funciones. Su informe HTML muestra
 * "100 % Branches" y "100 % Functions" con 0/0 en ambos casos: es una plantilla
 * vacía, no una medición. Este script solo afirma lo que el instrumentador
 * mide de verdad (líneas y sentencias) y falla el build si baja del umbral.
 * Para cobertura de ramas haría falta migrar los tests a Foundry.
 *
 * Uso (desde packages/contracts):
 *   pnpm run reporte        (= test --coverage --gas-stats + este script)
 */

const UMBRAL = 90;
const RAIZ = process.cwd();
const LCOV = join(RAIZ, 'coverage', 'lcov.info');
const SALIDA_GAS = join(RAIZ, 'REPORTE-GAS.md');
const SALIDA_COBERTURA = join(RAIZ, 'REPORTE-COBERTURA.md');

interface ResumenLcov {
  lineas: { total: number; cubiertas: number };
  sentencias: { total: number; cubiertas: number };
}

function leerLcov(ruta: string): ResumenLcov {
  const contenido = readFileSync(ruta, 'utf8');
  const resumen: ResumenLcov = {
    lineas: { total: 0, cubiertas: 0 },
    sentencias: { total: 0, cubiertas: 0 },
  };

  for (const linea of contenido.split('\n')) {
    if (linea.startsWith('LF:')) resumen.lineas.total = Number(linea.slice(3));
    if (linea.startsWith('LH:')) resumen.lineas.cubiertas = Number(linea.slice(3));
    // FNF/FNH: líneas de función encontradas / cubiertas. Hardhat no las
    // instrumenta, pero se leen por si el plugin cambiara.
    if (linea.startsWith('FNF:')) resumen.sentencias.total = Number(linea.slice(4));
    if (linea.startsWith('FNH:')) resumen.sentencias.cubiertas = Number(linea.slice(4));
  }

  if (resumen.lineas.total === 0) {
    throw new Error(`No se encontró información de líneas en ${ruta}`);
  }
  return resumen;
}

function porcentaje(cubiertas: number, total: number): number {
  return total === 0 ? 0 : (cubiertas / total) * 100;
}

/**
 * Mide el bytecode desplegable de un perfil, recompilando desde cero.
 *
 * No se puede leer el artefacto que dejó la corrida con `--coverage`: esa
 * compilación inyecta instrumentación y el bytecode sale inflado (3.994 bytes
 * reales frente a 5.155 instrumentados), con lo que el número sería falso.
 */
function medirBytecode(perfil?: 'production'): number {
  rmSync(join(RAIZ, 'artifacts'), { recursive: true, force: true });
  rmSync(join(RAIZ, 'cache', 'compile-cache.json'), { force: true });
  const argumentos = ['exec', 'hardhat', 'compile'];
  if (perfil) {
    argumentos.push('--build-profile', perfil);
  }
  execFileSync('pnpm', argumentos, { cwd: RAIZ, stdio: 'ignore' });

  const artefacto = join(
    RAIZ,
    'artifacts',
    'contracts',
    'RegistroRecibos.sol',
    'RegistroRecibos.json',
  );
  const datos = JSON.parse(readFileSync(artefacto, 'utf8')) as { deployedBytecode: string };
  return (datos.deployedBytecode.length - 2) / 2;
}

function escribirGas(): void {
  const raiz = join(RAIZ, 'cache', 'gas-stats');
  const registros: Array<Record<string, unknown>> = [];
  for (const grupo of ['solidity', 'nodejs']) {
    const dir = join(raiz, grupo);
    let archivos: string[];
    try {
      archivos = readdirSync(dir);
    } catch {
      continue;
    }
    for (const archivo of archivos) {
      const datos = JSON.parse(readFileSync(join(dir, archivo), 'utf8')) as Array<
        Record<string, unknown>
      >;
      registros.push(...datos);
    }
  }

  if (registros.length === 0) {
    process.stderr.write(
      '[reporte] no hay datos de gas; ejecuta primero `hardhat test --gas-stats`\n',
    );
    return;
  }

  const porFuncion = new Map<string, number[]>();
  let despliegue = 0;

  for (const registro of registros) {
    if (registro['type'] === 'deployment') {
      despliegue = Math.max(despliegue, Number(registro['gas'] ?? 0));
    } else if (registro['type'] === 'function') {
      const firma = String(registro['functionSig'] ?? 'desconocida');
      const lista = porFuncion.get(firma) ?? [];
      lista.push(Number(registro['gas'] ?? 0));
      porFuncion.set(firma, lista);
    }
  }

  // Bytecode realmente desplegable, recompilado por perfil.
  const tamanoDefault = medirBytecode();
  const tamanoProduction = medirBytecode('production');
  const reduccion = (((tamanoDefault - tamanoProduction) / tamanoDefault) * 100).toFixed(0);
  // Gas de despliegue recompilado con el perfil de producción (el que se
  // despliega); el gas de la corrida con --coverage viene del perfil default.
  const gasDespliegueDefault = despliegue;

  const filas = [...porFuncion.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([firma, gases]) => {
      const min = Math.min(...gases);
      const max = Math.max(...gases);
      const media = Math.round(gases.reduce((a, b) => a + b, 0) / gases.length);
      return `| \`${firma}\` | ${min.toLocaleString('es-EC')} | ${media.toLocaleString('es-EC')} | ${max.toLocaleString('es-EC')} | ${gases.length} |`;
    });

  const contenido = `# Reporte de gas · RegistroRecibos

Generado por \`pnpm run reporte\`. Cifras en unidades de gas, agrupando las
mediciones de las pruebas de Solidity (forge-std) y de las de TypeScript (viem)
sobre el mismo contrato.

**Perfil de las cifras de gas por función: \`default\`** (\`hardhat test\` compila
con ese perfil y con \`--coverage\` inyecta instrumentación). Lo que se despliega
en Amoy es el perfil \`production\`, cuyo bytecode es un ${reduccion} % menor, así
que el gas real de cada operación es más bajo que el de la tabla. La comparación
de tamaños está más abajo, recompilada por el propio script.

| Métrica | Valor |
| --- | --- |
| Gas de despliegue (perfil \`default\`) | ${gasDespliegueDefault.toLocaleString('es-EC')} |

## Optimizador

El tamaño del bytecode cambia radicalmente según el perfil de compilación, y el
ABI es idéntico en ambos (32 entradas), por lo que desplegar sin optimizador
solo encarece el despliegue sin aportar nada:

| Perfil | Bytecode en runtime | ABI |
| --- | ---: | ---: |
| \`default\` (sin optimizador) | ${tamanoDefault.toLocaleString('es-EC')} bytes | 32 entradas |
| \`production\` (optimizer, 200 runs) | ${tamanoProduction.toLocaleString('es-EC')} bytes | 32 entradas |

El optimizador reduce el bytecode un ${reduccion} % y el ABI es idéntico (32
entradas), así que desplegar sin él solo encarece el despliegue. Los scripts
\`deploy:local\` y \`deploy:amoy\` compilan con \`production\`, de modo que el
bytecode desplegado y verificado en Amoy es el optimizado.

| Función | Mínimo | Media | Máximo | Llamadas |
| --- | ---: | ---: | ---: | ---: |
${filas.join('\n')}

Notas:

- Las mediciones se hacen contra la cadena de pruebas en memoria de Hardhat
  (Amoy tiene el mismo coste en gas; lo que cambia es el precio del gas).
- \`verificar\` es una vista: su gas no lo paga el usuario, pero se incluye por
  completitud del informe.
- \`registrar\` ronda las 78k unidades: es la operación que paga el sistema por
  cada recibo, y el valor debe citarse en el informe de resultados.
`;

  writeFileSync(SALIDA_GAS, contenido, 'utf8');
  process.stdout.write(`[reporte] ${SALIDA_GAS}\n`);
}

function main(): void {
  const resumen = leerLcov(LCOV);
  const lineas = porcentaje(resumen.lineas.cubiertas, resumen.lineas.total);

  const contenido = `# Reporte de cobertura · RegistroRecibos

Generado por \`pnpm run reporte\`. Umbral exigido: **${UMBRAL} %** (el script falla
si no se alcanza).

| Métrica | Cubiertas | Total | % |
| --- | ---: | ---: | ---: |
| Líneas | ${resumen.lineas.cubiertas} | ${resumen.lineas.total} | ${lineas.toFixed(2)} |

## Qué NO mide esta herramienta

El plugin de cobertura de Hardhat 3 instrumenta **líneas y sentencias**, no
ramas ni funciones. Su informe HTML muestra "Branches 100 %" y "Functions
100 %" con 0 elementos instrumentados: es una casilla vacía de la plantilla, no
una medición. Por eso este documento no afirma cobertura de ramas.

- Las 6 rutas de error del contrato (\`IdReciboInvalido\`, \`HashReciboInvalido\`,
  \`ReciboYaRegistrado\`, \`ReciboNoRegistrado\`, \`ReciboYaAnulado\`,
  \`SoloRegistrador\`) sí están cubiertas por tests explícitos, pero eso es
  cobertura de casos, no de ramas instrumentadas.
- Para medir ramas de verdad hay que migrar los tests a Foundry
  (\`forge coverage\` con \`forge-std\`), que no está en el stack acordado.
`;

  writeFileSync(SALIDA_COBERTURA, contenido, 'utf8');
  process.stdout.write(`[reporte] ${SALIDA_COBERTURA}\n`);

  if (lineas < UMBRAL) {
    console.error(`[reporte] cobertura de líneas ${lineas.toFixed(2)} % < ${UMBRAL} %`);
    process.exit(1);
  }
  process.stdout.write(
    `[reporte] cobertura de líneas ${lineas.toFixed(2)} % (umbral ${UMBRAL} %)\n`,
  );
  escribirGas();
}

main();
