/** Quito usa UTC−5 todo el año (no hay horario de verano). */
const DESFASE_ECUADOR = '-05:00';
const UN_DIA_MS = 86_400_000;

export interface Periodo {
  desde?: Date;
  hastaExclusivo?: Date;
}

/** Convierte fechas de calendario de Ecuador (`YYYY-MM-DD`, inclusivas) en instantes UTC. */
export function periodoEnEcuador(desde?: string, hasta?: string): Periodo {
  const inicioDelDia = (fecha: string) => new Date(`${fecha}T00:00:00.000${DESFASE_ECUADOR}`);
  return {
    desde: desde ? inicioDelDia(desde) : undefined,
    hastaExclusivo: hasta ? new Date(inicioDelDia(hasta).getTime() + UN_DIA_MS) : undefined,
  };
}
