import { cn } from '@/lib/utils';

import { CLASES_TONO, presentacionDe, type Dominio, type EstadoDe } from './estados';

type Props = {
  [D in Dominio]: {
    dominio: D;
    estado: EstadoDe<D>;
    className?: string;
    'data-testid'?: string;
  };
}[Dominio];

/** Estado = texto + icono + color (DESIGN.md §Insignias). El texto es el nombre accesible. */
export function EstadoInsignia({ dominio, estado, className, 'data-testid': testId }: Props) {
  const { tono, icono: Icono, texto } = presentacionDe(dominio, estado);

  return (
    <span
      data-tono={tono}
      // El código técnico queda como atributo: las pruebas lo leen sin depender del texto.
      data-estado={estado}
      data-testid={testId}
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full py-1 pr-[11px] pl-2 text-caption leading-none font-semibold whitespace-nowrap',
        CLASES_TONO[tono],
        className,
      )}
    >
      <Icono aria-hidden="true" className="size-3.5 shrink-0" />
      {texto}
    </span>
  );
}
