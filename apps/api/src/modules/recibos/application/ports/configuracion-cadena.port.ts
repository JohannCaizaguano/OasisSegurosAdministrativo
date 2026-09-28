export const CONFIG_CADENA = Symbol('ConfiguracionCadenaPort');

export interface ConfiguracionCadenaPort {
  readonly chainId: number;
  readonly maxFeePerGasGwei: number;
  readonly explorerBaseUrl: string;
  /** Lanza DomainError si CONTRACT_ADDRESS no está configurado. */
  obtenerContractAddress(): string;
  /** Variante que devuelve null en lugar de lanzar, para lecturas tolerantes. */
  contractAddressSiExiste(): string | null;
}
