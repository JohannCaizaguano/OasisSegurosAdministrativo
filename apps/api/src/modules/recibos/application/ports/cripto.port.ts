export const CRIPTO = Symbol('CriptoPort');

/**
 * Fuente de aleatoriedad e identificadores del módulo de recibos.
 * El código público es corto y apto para URL/QR; la sal es de 32 bytes.
 */
export interface CriptoPort {
  generarId(): string;
  generarCodigo(): string;
  generarSal(): string;
}
