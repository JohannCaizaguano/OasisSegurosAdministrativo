/**
 * Identificaciones ecuatorianas válidas para pruebas (D19): únicas por semilla,
 * sin valores fijos que choquen entre corridas.
 */

/** Cédula de provincia 17 con el verificador módulo 10 calculado (RN-11). */
export function cedulaValida(semilla: number): string {
  const cuerpo = `${semilla % 6}${String(Math.trunc(semilla) % 1_000_000).padStart(6, '0')}`;
  const base = `17${cuerpo}`;
  return `${base}${digitoVerificador(base)}`;
}

/** RUC de sociedad privada (tercer dígito 9) terminado en 001, único por semilla. */
export function rucSociedad(semilla: number): string {
  return `179${String(Math.trunc(semilla) % 10_000_000).padStart(7, '0')}001`;
}

function digitoVerificador(base: string): number {
  const suma = [...base].reduce((acc, digito, indice) => {
    const producto = Number(digito) * (indice % 2 === 0 ? 2 : 1);
    return acc + (producto > 9 ? producto - 9 : producto);
  }, 0);
  return (10 - (suma % 10)) % 10;
}
