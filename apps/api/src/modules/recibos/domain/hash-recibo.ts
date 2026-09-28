import { ValueObject } from '../../../shared-kernel/value-object';

export interface PropsHashRecibo {
  hash: string;
  sal: string;
}

const HEX_32 = /^0x[0-9a-f]{64}$/i;

/**
 * Value Object del hash anclado:
 *   hashRecibo = keccak256(sal ‖ payloadCanónico)
 * La sal (32 bytes aleatorios) solo se guarda en la base de datos; el cálculo
 * criptográfico vive en un adaptador (application/ports/hasher-recibos.port.ts)
 * para mantener el dominio libre de frameworks.
 */
export class HashRecibo extends ValueObject<PropsHashRecibo> {
  private constructor(props: PropsHashRecibo) {
    super(props);
  }

  static de(hash: string, sal: string): HashRecibo {
    if (!HEX_32.test(hash)) {
      throw new Error(`Hash de recibo inválido: ${hash}`);
    }
    if (!HEX_32.test(sal)) {
      throw new Error('La sal debe tener 32 bytes en hexadecimal');
    }
    return new HashRecibo({ hash: hash.toLowerCase(), sal: sal.toLowerCase() });
  }

  get hash(): string {
    return this.props.hash;
  }

  get sal(): string {
    return this.props.sal;
  }
}
