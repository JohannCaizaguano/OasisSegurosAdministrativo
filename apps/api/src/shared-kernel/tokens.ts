/**
 * Tokens de inyección para servicios transversales. Los puertos de cada módulo
 * definen sus propios tokens junto a la interfaz (puerto) que representan.
 */
export const TOKENS_TRANSVERSALES = {
  CLOCK: Symbol('ClockPort'),
} as const;

export type NombreTokenTransversal = keyof typeof TOKENS_TRANSVERSALES;
