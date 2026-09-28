const FACTORES: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3_600,
  d: 86_400,
};

/** Convierte duraciones tipo "15m", "7d", "3600s" a segundos. */
export function duracionASegundos(duracion: string): number {
  const coincidencia = /^(\d+)\s*(s|m|h|d)?$/.exec(duracion.trim());
  if (!coincidencia) {
    throw new Error(`Duración inválida: ${duracion}`);
  }
  const cantidad = Number(coincidencia[1]);
  const unidad = coincidencia[2] ?? 's';
  const factor = FACTORES[unidad];
  if (!factor) {
    throw new Error(`Unidad de duración inválida: ${duracion}`);
  }
  return cantidad * factor;
}
