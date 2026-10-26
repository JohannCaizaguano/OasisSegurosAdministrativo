const VISIBLES = 4;

/** D7: deja visibles los 4 últimos caracteres; con menos de 5, no deja ninguno. */
export function enmascararIdentificacion(identificacion: string): string {
  if (identificacion.length <= VISIBLES) return '*'.repeat(identificacion.length);
  return '*'.repeat(identificacion.length - VISIBLES) + identificacion.slice(-VISIBLES);
}
