const FORMATO_GUAYAQUIL = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' });

/** Fecha civil (`aaaa-mm-dd`) de un instante en Ecuador continental. */
export function fechaEnGuayaquil(instante: Date): string {
  return FORMATO_GUAYAQUIL.format(instante);
}
