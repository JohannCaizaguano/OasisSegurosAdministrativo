import { Injectable } from '@nestjs/common';
import { concat, hexToBytes, keccak256, stringToHex, toHex } from 'viem';

import { HashRecibo } from '../../domain/hash-recibo';
import type { HasherRecibosPort } from '../../application/ports/hasher-recibos.port';

@Injectable()
export class ViemHasherRecibosAdapter implements HasherRecibosPort {
  hashRecibo(payloadCanonico: string, sal: string): HashRecibo {
    const bytes = concat([hexToBytes(sal as `0x${string}`), stringToHex(payloadCanonico)]);
    return HashRecibo.de(keccak256(bytes), sal);
  }

  hashTexto(texto: string): string {
    return keccak256(toHex(texto));
  }
}
