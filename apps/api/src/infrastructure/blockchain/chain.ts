import type { Chain } from 'viem';
import { hardhat, polygon, polygonAmoy } from 'viem/chains';

/**
 * Selección de red a partir de CHAIN_ID:
 *   31337 -> Hardhat local | 80002 -> Polygon Amoy | 137 -> Polygon PoS
 */
export function seleccionarChain(chainId: number): Chain | undefined {
  switch (chainId) {
    case hardhat.id:
      return hardhat;
    case polygonAmoy.id:
      return polygonAmoy;
    case polygon.id:
      return polygon;
    default:
      return undefined;
  }
}

export function cadenaSoportada(chainId: number): boolean {
  return seleccionarChain(chainId) !== undefined;
}
