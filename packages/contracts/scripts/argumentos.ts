import { parseArgs } from 'node:util';

import { network } from 'hardhat';
import { getAddress, type Address } from 'viem';

/**
 * Los scripts de administración se ejecutan con `node` para aceptar opciones propias. Las
 * cuentas firmantes salen de la red de Hardhat (keystore en Amoy), nunca de un `.env`.
 */
export function leerArgumentos(opciones: Record<string, { type: 'string' | 'boolean' }>) {
  return parseArgs({ options: { red: { type: 'string', default: 'localhost' }, ...opciones } })
    .values as Record<string, string | boolean | undefined>;
}

export function direccion(valor: string | boolean | undefined, nombre: string): Address {
  if (typeof valor !== 'string') {
    throw new Error(`Falta --${nombre} <dirección>`);
  }
  return getAddress(valor);
}

export async function conectar(red: string, contrato: Address) {
  const { viem } = await network.create(red);
  const publicClient = await viem.getPublicClient();
  const [firmante] = await viem.getWalletClients();
  if (!firmante) {
    throw new Error(`La red ${red} no tiene cuentas de firma configuradas en el keystore`);
  }
  const registro = await viem.getContractAt('RegistroRecibos', contrato);
  return { publicClient, firmante, registro };
}
