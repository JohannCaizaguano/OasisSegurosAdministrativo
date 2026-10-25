// Lanzador de la infraestructura para Playwright (y para pruebas locales):
//   1. Nodo Hardhat local y despliegue (pnpm dev:chain), salvo que :8545 ya responda.
//   2. API y worker de NestJS.
// Playwright espera el health del API y, al terminar, apaga el árbol completo.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raizRepo = resolve(aqui, '../../..');
const rutaApi = resolve(raizRepo, 'apps/api');

const hijos = [];
let apagando = false;

/** PIDs de toda la descendencia de `raiz` (POSIX), leídos de `ps`. */
function descendientes(raiz) {
  const salida = spawnSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' }).stdout ?? '';
  const hijosDe = new Map();
  for (const linea of salida.split('\n')) {
    const [pid, ppid] = linea.trim().split(/\s+/).map(Number);
    if (!pid) continue;
    hijosDe.set(ppid, [...(hijosDe.get(ppid) ?? []), pid]);
  }
  const encontrados = [];
  const pendientes = [raiz];
  while (pendientes.length > 0) {
    for (const pid of hijosDe.get(pendientes.pop()) ?? []) {
      encontrados.push(pid);
      pendientes.push(pid);
    }
  }
  return encontrados;
}

/**
 * Cierra los hijos y TODA su descendencia, sin tocar al proceso padre. `child.kill()` solo
 * señaliza al shell intermedio (`shell: true`). Los hijos no se separan del grupo para que también
 * los alcance el SIGKILL que Playwright envía al grupo del webServer.
 */
function apagar(codigoSalida = 0) {
  if (apagando) return;
  apagando = true;
  for (const hijo of hijos) {
    if (hijo.exitCode !== null || hijo.signalCode !== null) continue;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
      continue;
    }
    for (const pid of [...descendientes(hijo.pid), hijo.pid]) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // El proceso ya había terminado.
      }
    }
  }
  setTimeout(() => process.exit(codigoSalida), 1_000);
}

process.on('SIGTERM', () => apagar(0));
process.on('SIGINT', () => apagar(0));

function lanzar(comando, argumentos, opciones = {}) {
  const hijo = spawn(comando, argumentos, {
    cwd: opciones.cwd ?? raizRepo,
    stdio: opciones.stdio ?? 'inherit',
    shell: true,
    env: { ...process.env, ...opciones.env },
  });
  hijos.push(hijo);
  if (opciones.fatal !== false) {
    hijo.on('exit', (codigo) => {
      if (!apagando && codigo !== null && codigo !== 0) {
        apagar(codigo);
      }
    });
  }
  return hijo;
}

async function esperarRpc(url = 'http://127.0.0.1:8545', intentos = 60) {
  for (let i = 0; i < intentos; i += 1) {
    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
      });
      if (respuesta.ok) return;
    } catch {
      // todavía no responde
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error('El nodo Hardhat no respondió a tiempo');
}

async function rpc(metodo, parametros) {
  const respuesta = await fetch('http://127.0.0.1:8545', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: metodo, params: parametros, id: 1 }),
  });
  return (await respuesta.json()).result;
}

/** Un nodo reiniciado arranca vacío: el contrato del .env debe existir antes de reutilizarlo. */
async function exigirContratoDesplegado() {
  const env = readFileSync(resolve(rutaApi, '.env'), 'utf8');
  const direccion = /^CONTRACT_ADDRESS=(\S+)/m.exec(env)?.[1];
  const codigo = direccion ? await rpc('eth_getCode', [direccion, 'latest']) : undefined;
  if (!codigo || codigo === '0x') {
    throw new Error(
      `No hay contrato en CONTRACT_ADDRESS (${direccion ?? 'sin definir'}) del nodo de :8545. ` +
        'Ejecute `pnpm dev:chain` y vuelva a intentarlo.',
    );
  }
}

async function rpcResponde() {
  try {
    await esperarRpc(undefined, 1);
    return true;
  } catch {
    return false;
  }
}

async function principal() {
  // Con `pnpm dev:infra` el nodo ya corre en el contenedor y `pnpm dev:chain` ya escribió el .env:
  // se reutilizan (redesplegar cambiaría la dirección del contrato de los recibos ya anclados).
  if (await rpcResponde()) {
    await exigirContratoDesplegado();
    console.log('[e2e] Nodo Hardhat en :8545 ya activo; se reutiliza con su despliegue.');
  } else {
    await levantarCadena();
  }

  console.log('[e2e] Iniciando API y worker…');
  lanzar('node', ['dist/main.js'], { cwd: rutaApi });
  lanzar('node', ['dist/worker.js'], { cwd: rutaApi });

  setInterval(() => {}, 1 << 30);
}

async function levantarCadena() {
  console.log('[e2e] Iniciando nodo Hardhat…');
  lanzar('pnpm', [
    '--filter',
    '@oasis/contracts',
    'exec',
    'hardhat',
    'node',
    '--hostname',
    '127.0.0.1',
  ]);
  await esperarRpc();

  console.log('[e2e] Desplegando RegistroRecibos y otorgando REGISTRADOR_ROLE…');
  const despliegue = spawnSync('pnpm', ['dev:chain'], {
    cwd: raizRepo,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (despliegue.status !== 0) {
    throw new Error('pnpm dev:chain falló');
  }
}

principal().catch((error) => {
  console.error('[e2e] Launcher falló:', error.message);
  apagar(1);
});
