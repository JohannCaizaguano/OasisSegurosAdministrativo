import { Global, Module, type Provider } from '@nestjs/common';

import { AppConfig } from '../../config/app.config';
import { APP_CHAIN, PUBLIC_CLIENT } from './blockchain.constants';
import { cadenaActual, crearPublicClient } from './clients';

const proveedorChain: Provider = {
  provide: APP_CHAIN,
  inject: [AppConfig],
  useFactory: (config: AppConfig) => cadenaActual(config),
};

const proveedorPublicClient: Provider = {
  provide: PUBLIC_CLIENT,
  inject: [AppConfig],
  useFactory: (config: AppConfig) => crearPublicClient(config),
};

/**
 * Solo lectura de la cadena (eth_call). El API nunca tiene la clave privada;
 * el walletClient se provee únicamente en el WorkerModule.
 */
@Global()
@Module({
  providers: [proveedorChain, proveedorPublicClient],
  exports: [APP_CHAIN, PUBLIC_CLIENT],
})
export class BlockchainModule {}
