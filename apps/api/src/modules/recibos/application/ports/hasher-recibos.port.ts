import type { HashRecibo } from '../../domain/hash-recibo';

export const HASHER_RECIBOS = Symbol('HasherRecibosPort');

/**
 * Cálculo criptográfico del módulo blockchain (keccak256). Se implementa en
 * infrastructure/blockchain con viem para que el dominio permanezca puro.
 */
export interface HasherRecibosPort {
  /** hashRecibo = keccak256(sal ‖ payloadCanónico) */
  hashRecibo(payloadCanonico: string, sal: string): HashRecibo;
  /** keccak256 del texto en UTF-8 (por ejemplo, el uuid para idOnchain). */
  hashTexto(texto: string): string;
}
