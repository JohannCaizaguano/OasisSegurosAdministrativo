export function formatearMoneda(monto: string | number): string {
  const numero = typeof monto === 'string' ? Number(monto) : monto;
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(numero) ? numero : 0);
}

export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) {
    return '—';
  }
  const valor = fecha.includes('T') ? fecha : `${fecha}T00:00:00`;
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    ...(fecha.includes('T') ? { timeStyle: 'short' as const } : {}),
  }).format(new Date(valor));
}

export function acortarHash(hash: string | null | undefined): string {
  if (!hash) {
    return '—';
  }
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}
