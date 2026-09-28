import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../../config/app.config';
import { ErrorDependenciaExterna } from '../../../../shared-kernel/domain-error';
import type { ConfiguracionCadenaPort } from '../../application/ports/configuracion-cadena.port';

@Injectable()
export class ConfiguracionCadenaAdapter implements ConfiguracionCadenaPort {
  constructor(private readonly config: AppConfig) {}

  get chainId(): number {
    return this.config.blockchain.chainId;
  }

  get maxFeePerGasGwei(): number {
    return this.config.blockchain.maxFeePerGasGwei;
  }

  get explorerBaseUrl(): string {
    return this.config.blockchain.explorerBaseUrl;
  }

  obtenerContractAddress(): string {
    const direccion = this.config.blockchain.contractAddress;
    if (!direccion) {
      throw new ErrorDependenciaExterna(
        'CONTRACT_ADDRESS no está configurado: despliegue el contrato y actualice el entorno',
      );
    }
    return direccion;
  }
}
