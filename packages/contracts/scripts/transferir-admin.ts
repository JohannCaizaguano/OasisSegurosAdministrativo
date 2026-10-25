import { createInterface } from 'node:readline/promises';

import { transferirAdmin } from './administracion.ts';
import { conectar, direccion, leerArgumentos } from './argumentos.ts';

// Uso: pnpm --filter @oasis/contracts transferir-admin --red amoy --contrato 0x… --fria 0x…
// En Amoy firma DEPLOYER_PRIVATE_KEY (keystore). La renuncia es irreversible: se confirma a mano.
const args = leerArgumentos({ contrato: { type: 'string' }, fria: { type: 'string' } });
const red = String(args.red);
const fria = direccion(args.fria, 'fria');
const { publicClient, firmante, registro } = await conectar(
  red,
  direccion(args.contrato, 'contrato'),
);

async function confirmar(): Promise<boolean> {
  if (red === 'localhost' || red === 'default') return true;
  const consola = createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = await consola.question(
    `La billetera fría ${fria} ya es administradora. ¿Renunciar el rol de ${firmante.account.address}? ` +
      'Es irreversible. Escriba "renunciar" para continuar: ',
  );
  consola.close();
  return respuesta.trim() === 'renunciar';
}

const { transacciones } = await transferirAdmin({
  registro,
  publicClient,
  desplegador: firmante.account,
  fria,
  confirmar,
});
console.log(
  `Listo en ${red}: ${transacciones.length} transacciones. Anote los txHash en el informe.`,
);
