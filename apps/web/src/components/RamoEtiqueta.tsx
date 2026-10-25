import { cn } from '@/lib/utils';

import { iconoDeRamo } from './ramos';

type Props = { codigo: string; nombre: string; className?: string };

/** Ícono + nombre del ramo: el ícono acelera la lectura, el nombre es el dato accesible. */
export function RamoEtiqueta({ codigo, nombre, className }: Props) {
  const { icono: Icono, clave } = iconoDeRamo(codigo);

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Icono aria-hidden="true" data-ramo={clave} className="size-4 shrink-0" />
      {nombre}
    </span>
  );
}
