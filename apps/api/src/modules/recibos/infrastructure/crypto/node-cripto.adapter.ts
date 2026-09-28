import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';

import type { CriptoPort } from '../../application/ports/cripto.port';

const LONGITUD_CODIGO = 6;

@Injectable()
export class NodeCriptoAdapter implements CriptoPort {
  generarId(): string {
    return randomUUID();
  }

  generarCodigo(): string {
    const aleatorio = randomBytes(LONGITUD_CODIGO).toString('hex').toUpperCase();
    return `RC-${aleatorio}`;
  }

  generarSal(): string {
    return `0x${randomBytes(32).toString('hex')}`;
  }
}
