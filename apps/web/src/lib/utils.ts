import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases));
}

/** Construye una query string omitiendo valores vacíos o indefinidos. */
export function construirQuery(
  parametros: Record<string, string | number | boolean | undefined | null>,
): string {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      busqueda.set(clave, String(valor));
    }
  }
  const texto = busqueda.toString();
  return texto ? `?${texto}` : '';
}
