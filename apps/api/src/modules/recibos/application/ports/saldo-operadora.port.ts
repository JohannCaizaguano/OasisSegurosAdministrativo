import type { SaldoOperadora } from '@oasis/shared';

export const SALDO_OPERADORA = Symbol('SaldoOperadoraPort');

/** Lectura que el worker deja en Redis (D17); el API nunca conoce la cuenta operadora. */
export interface LecturaSaldoOperadora {
  wei: string;
  pol: string;
  umbralPol: string;
  bajoUmbral: boolean;
  actualizadoEn: string;
}

export interface SaldoOperadoraPort {
  guardar(lectura: LecturaSaldoOperadora): Promise<void>;
  /** `{ disponible: false }` si el worker no publicó una lectura vigente. */
  leer(): Promise<SaldoOperadora>;
}
