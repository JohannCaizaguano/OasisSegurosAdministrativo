import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge no conoce los tamaños, espaciados y sombras propios: los toma por colores y
// descarta, por ejemplo, `text-label` al combinarlo con `text-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'caption',
        'label',
        'cuerpo',
        'title',
        'headline',
        'headline-movil',
        'cifra',
        'heroe',
        'display',
        'mini',
        'tabla',
      ],
      spacing: ['control', 'input', 'login', 'riel'],
      shadow: ['oro', 'oro-login', 'noche'],
    },
  },
});

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
