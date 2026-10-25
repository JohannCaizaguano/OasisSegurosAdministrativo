const MAX_CUOTAS = 24;

/** `'518.4'` → `51840`. Los montos viajan como string decimal con hasta dos decimales. */
export function aCentavos(monto: string): number {
  const [enteros, decimales = ''] = monto.split('.');
  return Number(enteros) * 100 + Number(decimales.padEnd(2, '0'));
}

export function aMonto(centavos: number): string {
  return `${Math.trunc(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}`;
}

export function sumarMontos(valores: readonly string[]): string {
  return aMonto(valores.reduce((total, valor) => total + aCentavos(valor), 0));
}

/** Suma meses a una fecha `aaaa-mm-dd` conservando el día y recortándolo al último del mes. */
export function sumarMesesRecortando(fecha: string, meses: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const indice = anio * 12 + (mes - 1) + meses;
  const anioNuevo = Math.floor(indice / 12);
  const mesNuevo = (indice % 12) + 1;
  const ultimoDia = new Date(Date.UTC(anioNuevo, mesNuevo, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${anioNuevo}-${pad(mesNuevo)}-${pad(Math.min(dia, ultimoDia))}`;
}

export interface CuotaPropuesta {
  numero: number;
  valor: string;
  fechaVencimiento: string;
}

/**
 * Propuesta mensual del plan (D12): valores en centavos enteros, la última cuota absorbe el
 * residuo y cada cuota vale al menos 0.01.
 */
export function proponerPlanCuotas(
  prima: string,
  n: number,
  fechaInicio: string,
): CuotaPropuesta[] {
  const total = aCentavos(prima);
  if (!Number.isInteger(n) || n < 1 || n > MAX_CUOTAS || total < n) {
    throw new RangeError('Número de cuotas inválido para la prima');
  }
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    valor: aMonto(i === n - 1 ? total - base * (n - 1) : base),
    fechaVencimiento: sumarMesesRecortando(fechaInicio, i),
  }));
}
