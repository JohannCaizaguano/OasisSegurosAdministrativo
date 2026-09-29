import type { Provider } from '@nestjs/common';
import type { Chain, WalletClient } from 'viem';
import { createWalletClient } from 'viem';
import { createNonceManager, jsonRpc } from 'viem/nonce';
import { privateKeyToAccount } from 'viem/accounts';

import { AppConfig } from '../../config/app.config';
import { claveOperadoraDelEntorno } from '../../config/env.schema';
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
    const clave = claveOperadoraDelEntorno();
    const account = privateKeyToAccount(clave, { nonceManager });

    return createWalletClient({
      account,
      chain,
      transport: crearTransporte(config),
    }) as WalletClient;
  },
};
