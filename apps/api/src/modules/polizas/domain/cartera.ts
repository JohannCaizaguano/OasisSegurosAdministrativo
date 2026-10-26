import type { VistaCartera } from '@oasis/shared';

const DIA_MS = 86_400_000;
/** HU-38: «por vencer» son los próximos 7 días. */
const DIAS_POR_VENCER = 7;

const aUtc = (fecha: string) => Date.parse(`${fecha}T00:00:00.000Z`);

export function sumarDias(fecha: string, dias: number): string {
  return new Date(aUtc(fecha) + dias * DIA_MS).toISOString().slice(0, 10);
}

/** 0 si la cuota aún no vence (o vence hoy). */
export function diasDeAtraso(fechaVencimiento: string, hoy: string): number {
  return Math.max(0, Math.round((aUtc(hoy) - aUtc(fechaVencimiento)) / DIA_MS));
}

/** D16: límites inclusivos de `fechaVencimiento` para cada vista. */
export function rangoDeVista(vista: VistaCartera, hoy: string): { desde?: string; hasta: string } {
  if (vista === 'VENCIDAS') return { hasta: sumarDias(hoy, -1) };
  const hasta = sumarDias(hoy, DIAS_POR_VENCER);
  return vista === 'POR_VENCER' ? { desde: hoy, hasta } : { hasta };
}
