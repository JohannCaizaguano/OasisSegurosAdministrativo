import type { Chain, PublicClient } from 'viem';
import { createPublicClient, fallback, http } from 'viem';

import { AppConfig } from '../../config/app.config';
import { seleccionarChain } from './chain';

export function crearTransporte(config: AppConfig) {
  const { rpcUrl, rpcUrlFallback } = config.blockchain;
  if (rpcUrlFallback) {
    return fallback([
      http(rpcUrl, { name: 'rpc-principal' }),
      http(rpcUrlFallback, { name: 'rpc-respaldo' }),
    ]);
  }
  return http(rpcUrl);
}

export function crearPublicClient(config: AppConfig): PublicClient {
  const chain = seleccionarChain(config.blockchain.chainId);
  return createPublicClient({ chain, transport: crearTransporte(config) });
}

export function cadenaActual(config: AppConfig): Chain | undefined {
  return seleccionarChain(config.blockchain.chainId);
}
