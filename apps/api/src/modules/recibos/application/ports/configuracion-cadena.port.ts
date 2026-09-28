export const CONFIG_CADENA = Symbol('ConfiguracionCadenaPort');

export interface ConfiguracionCadenaPort {
  readonly chainId: number;
  readonly maxFeePerGasGwei: number;
  readonly explorerBaseUrl: string;
  /** Lanza DomainError si CONTRACT_ADDRESS no está configurado. */
  obtenerContractAddress(): string;
}
