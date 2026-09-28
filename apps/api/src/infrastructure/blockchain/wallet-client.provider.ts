import type { Provider } from '@nestjs/common';
import type { Chain, WalletClient } from 'viem';
import { createWalletClient } from 'viem';
import { createNonceManager, jsonRpc } from 'viem/nonce';
import { privateKeyToAccount } from 'viem/accounts';

import { AppConfig } from '../../config/app.config';
import { workerEnvSchema } from '../../config/env.schema';
import { APP_CHAIN, WALLET_CLIENT } from './blockchain.constants';
import { crearTransporte } from './clients';

const nonceManager = createNonceManager({ source: jsonRpc() });

/**
 * Cuenta operadora (REGISTRADOR_ROLE). La clave privada vive SOLO en el
 * contenedor worker; este provider no se registra en el API.
 * Concurrencia 1 + nonceManager para evitar colisiones de nonce.
 */
export const proveedorWalletClient: Provider = {
  provide: WALLET_CLIENT,
  inject: [AppConfig, APP_CHAIN],
  useFactory: (config: AppConfig, chain: Chain | undefined): WalletClient => {
    const parseo = workerEnvSchema.shape.OPERATOR_PRIVATE_KEY.safeParse(
      process.env.OPERATOR_PRIVATE_KEY,
    );
    if (!parseo.success) {
      throw new Error(
        'OPERATOR_PRIVATE_KEY ausente o inválida. Solo el proceso worker debe configurarla.',
      );
    }

    const account = privateKeyToAccount(parseo.data as `0x${string}`, { nonceManager });

    return createWalletClient({
      account,
      chain,
      transport: crearTransporte(config),
    }) as WalletClient;
  },
};
