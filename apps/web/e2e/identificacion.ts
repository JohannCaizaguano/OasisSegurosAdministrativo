/** Cédula de provincia 17 con el verificador módulo 10 calculado (RN-11), única por semilla. */
export function cedulaValida(semilla: number): string {
  const cuerpo = `${semilla % 6}${String(Math.trunc(semilla) % 1_000_000).padStart(6, '0')}`;
  const base = `17${cuerpo}`;
  return `${base}${digitoVerificador(base)}`;
}

function digitoVerificador(base: string): number {
  const suma = [...base].reduce((acc, digito, indice) => {
    const producto = Number(digito) * (indice % 2 === 0 ? 2 : 1);
    return acc + (producto > 9 ? producto - 9 : producto);
  }, 0);
  return (10 - (suma % 10)) % 10;
}
