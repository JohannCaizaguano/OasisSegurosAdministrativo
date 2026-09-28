// Despliegue local completo del contrato RegistroRecibos:
//   1. Ignition despliega en el nodo Hardhat local (localhost:8545).
//   2. Se otorga REGISTRADOR_ROLE a la cuenta operadora local (cuenta #1).
//   3. Se escribe CONTRACT_ADDRESS y OPERATOR_PRIVATE_KEY en apps/api/.env.
//
// Las claves usadas son las cuentas de desarrollo PÚBLICAS de Hardhat, válidas
// únicamente en el nodo local (nunca tienen fondos en redes reales).
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../..');
const rutaContratos = resolve(raiz, 'packages/contracts');
const rutaEnvApi = resolve(raiz, 'apps/api/.env');
const rutaEnvEjemplo = resolve(raiz, '.env.example');

// viem se resuelve desde packages/contracts (donde es dependencia directa),
// para no depender del layout de node_modules de la raíz.
const requerirDesdeContratos = createRequire(resolve(rutaContratos, 'package.json'));
const { createPublicClient, createWalletClient, http } = requerirDesdeContratos('viem');
const { hardhat } = requerirDesdeContratos('viem/chains');
const { privateKeyToAccount } = requerirDesdeContratos('viem/accounts');

const rutaDirecciones = resolve(
  rutaContratos,
  'ignition/deployments/chain-31337/deployed_addresses.json',
);
const rutaArtifact = resolve(
  rutaContratos,
  'artifacts/contracts/RegistroRecibos.sol/RegistroRecibos.json',
);

const RPC_URL = process.env.RPC_URL ?? 'http://127.0.0.1:8545';
// Cuentas de desarrollo públicas de Hardhat (sin valor en redes reales).
const CLAVE_ADMIN_LOCAL = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const CLAVE_OPERADOR_LOCAL = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

function ejecutar(comando, args, cwd) {
  const resultado = spawnSync(comando, args, { cwd, stdio: 'inherit', shell: true });
  if (resultado.status !== 0) {
    throw new Error(`Falló el comando: ${comando} ${args.join(' ')}`);
  }
}

function actualizarEnv(clave, valor) {
  if (!existsSync(rutaEnvApi)) {
    copyFileSync(rutaEnvEjemplo, rutaEnvApi);
  }
  const lineas = readFileSync(rutaEnvApi, 'utf8').split(/\r?\n/);
  let encontrada = false;
  const nuevas = lineas.map((linea) => {
    if (linea.startsWith(`${clave}=`)) {
      encontrada = true;
      return `${clave}=${valor}`;
    }
    return linea;
  });
  if (!encontrada) {
    nuevas.push(`${clave}=${valor}`);
  }
  writeFileSync(rutaEnvApi, nuevas.join('\n'), 'utf8');
}

async function principal() {
  console.log('1/3 · Desplegando RegistroRecibos con Ignition en localhost…');
  ejecutar(
    'pnpm',
    [
      '--filter',
      '@oasis/contracts',
      'exec',
      'hardhat',
      'ignition',
      'deploy',
      'ignition/modules/RegistroRecibos.ts',
      '--network',
      'localhost',
    ],
    raiz,
  );

  if (!existsSync(rutaDirecciones)) {
    throw new Error(`No se encontró ${rutaDirecciones}. ¿Corrió el despliegue de Ignition?`);
  }
  const direcciones = JSON.parse(readFileSync(rutaDirecciones, 'utf8'));
  const direccionContrato =
    direcciones['RegistroRecibosModule#RegistroRecibos'] ??
    Object.values(direcciones).find((valor) => typeof valor === 'string');
  if (!direccionContrato) {
    throw new Error('Ignition no reportó la dirección de RegistroRecibos');
  }

  const artifact = JSON.parse(readFileSync(rutaArtifact, 'utf8'));
  const cuentaAdmin = privateKeyToAccount(CLAVE_ADMIN_LOCAL);
  const cuentaOperadora = privateKeyToAccount(CLAVE_OPERADOR_LOCAL);

  const publicClient = createPublicClient({ chain: hardhat, transport: http(RPC_URL) });
  const walletClient = createWalletClient({
    account: cuentaAdmin,
    chain: hardhat,
    transport: http(RPC_URL),
  });

  console.log('2/3 · Otorgando REGISTRADOR_ROLE a la cuenta operadora local…');
  const rol = await publicClient.readContract({
    address: direccionContrato,
    abi: artifact.abi,
    functionName: 'REGISTRADOR_ROLE',
  });
  const yaTiene = await publicClient.readContract({
    address: direccionContrato,
    abi: artifact.abi,
    functionName: 'hasRole',
    args: [rol, cuentaOperadora.address],
  });

  if (yaTiene) {
    console.log(`    La cuenta ${cuentaOperadora.address} ya tenía el rol.`);
  } else {
    const txHash = await walletClient.writeContract({
      address: direccionContrato,
      abi: artifact.abi,
      functionName: 'grantRole',
      args: [rol, cuentaOperadora.address],
      account: cuentaAdmin,
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`    Rol otorgado en la transacción ${txHash}`);
  }

  console.log('3/3 · Actualizando apps/api/.env…');
  actualizarEnv('CONTRACT_ADDRESS', direccionContrato);
  actualizarEnv('OPERATOR_PRIVATE_KEY', CLAVE_OPERADOR_LOCAL);
  actualizarEnv('CHAIN_ID', '31337');
  actualizarEnv('RPC_URL', RPC_URL);
  actualizarEnv('EXPLORER_BASE_URL', RPC_URL);

  console.log('');
  console.log('Listo. Contrato:', direccionContrato);
  console.log('Cuenta operadora local:', cuentaOperadora.address);
  console.log('Ahora ejecute: pnpm dev');
}

principal().catch((error) => {
  console.error('dev:chain falló:', error.message);
  process.exit(1);
});
