import { Injectable } from '@nestjs/common';
import { hash, verify } from 'argon2';

import type { HasherPort } from '../../application/ports/hasher.port';

@Injectable()
export class Argon2HasherAdapter implements HasherPort {
  hashear(textoPlano: string): Promise<string> {
    return hash(textoPlano);
  }

  verificar(hashAlmacenado: string, textoPlano: string): Promise<boolean> {
    return verify(hashAlmacenado, textoPlano);
  }
}
