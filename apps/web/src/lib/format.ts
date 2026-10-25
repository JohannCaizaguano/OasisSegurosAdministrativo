/** Formato único de Ecuador (The Tabular Money Rule): $1.234,50 · 06/10/2026. */
const MONEDA = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

const FECHA_HORA = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Guayaquil',
});

const SOLO_FECHA = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Guayaquil',
});

const FECHA_HORA_SEGUNDOS = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Guayaquil',
});

export function formatearMoneda(monto: string | number): string {
  const numero = typeof monto === 'string' ? Number(monto) : monto;
  return MONEDA.format(Number.isFinite(numero) ? numero : 0);
}

/** `aaaa-mm-dd` → `dd/mm/aaaa` sin pasar por `Date` (no depende de la zona); un instante ISO lleva además la hora de Ecuador. */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) {
    return '—';
  }
  if (!fecha.includes('T')) {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  return FECHA_HORA.format(new Date(fecha));
}

/** Solo la fecha `dd/mm/aaaa`, sea `aaaa-mm-dd` o un instante ISO (este en la zona de Ecuador). */
export function formatearSoloFecha(fecha: string | null | undefined): string {
  if (!fecha) {
    return '—';
  }
  return fecha.includes('T') ? SOLO_FECHA.format(new Date(fecha)) : formatearFecha(fecha);
}

export function acortarHash(hash: string | null | undefined): string {
  if (!hash) {
    return '—';
  }
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

/** Fecha y hora con segundos en la zona de Ecuador (UTC−5), sin importar la zona del navegador. */
export function formatearFechaHoraEcuador(iso: string): string {
  return FECHA_HORA_SEGUNDOS.format(new Date(iso));
}
