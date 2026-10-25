import { Injectable } from '@nestjs/common';
import { concat, keccak256, stringToHex, toHex, type Hex } from 'viem';

import { HashRecibo } from '../../domain/hash-recibo';
import type { HasherRecibosPort } from '../../application/ports/hasher-recibos.port';

@Injectable()
export class ViemHasherRecibosAdapter implements HasherRecibosPort {
  hashRecibo(payloadCanonico: string, sal: string): HashRecibo {
    // Ambos operandos en hex: con tipos mezclados, `concat` copiaría el texto como números.
    const bytes = concat([sal as Hex, stringToHex(payloadCanonico)]);
    return HashRecibo.de(keccak256(bytes), sal);
  }

  hashTexto(texto: string): string {
    return keccak256(toHex(texto));
  }
}
