import { Global, Module } from '@nestjs/common';

import { WALLET_CLIENT } from './blockchain.constants';
import { proveedorWalletClient } from './wallet-client.provider';

/**
 * Módulo global exclusivo del worker: provee la cuenta operadora
 * (REGISTRADOR_ROLE) con firma custodial. NUNCA se importa en AppModule.
 */
@Global()
@Module({
  providers: [proveedorWalletClient],
  exports: [WALLET_CLIENT],
})
export class CuentaOperadoraModule {}
