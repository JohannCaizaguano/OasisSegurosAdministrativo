// Lanzador de la infraestructura para Playwright (y para pruebas locales):
//   1. Nodo Hardhat local.
//   2. Despliegue del contrato + REGISTRADOR_ROLE (pnpm dev:chain) y .env del API.
//   3. API y worker de NestJS.
// Playwright espera el health del API y, al terminar, apaga el árbol completo.
import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raizRepo = resolve(aqui, '../../..');
const rutaApi = resolve(raizRepo, 'apps/api');

const hijos = [];
let apagando = false;

function apagar(codigoSalida = 0) {
  if (apagando) return;
  apagando = true;
  for (const hijo of hijos) {
    hijo.kill();
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

async function principal() {
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

  console.log('[e2e] Iniciando API y worker…');
  lanzar('node', ['dist/main.js'], { cwd: rutaApi });
  lanzar('node', ['dist/worker.js'], { cwd: rutaApi });

  setInterval(() => {}, 1 << 30);
}

principal().catch((error) => {
  console.error('[e2e] Launcher falló:', error.message);
  apagar(1);
});
