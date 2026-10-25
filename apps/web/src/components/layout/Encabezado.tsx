import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  descripcion?: ReactNode;
  /** Acciones de la página, a la derecha; como máximo una con `variant="primary"`. */
  children?: ReactNode;
}

/** Cabecera de cada página: título, frase de contexto y acciones (DESIGN.md §Layout). */
export function Encabezado({ titulo, descripcion, children }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-headline-movil font-bold riel:text-headline">{titulo}</h1>
        {descripcion ? <p className="max-w-[65ch] text-muted-foreground">{descripcion}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2.5">{children}</div> : null}
    </header>
  );
}
