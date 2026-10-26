import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { CLASES_TONO, type Tono } from '@/components/estados';
import { cn } from '@/lib/utils';

export interface PasoLineaTiempo {
  titulo: string;
  /** El estado del paso en texto («Completado», «En curso»): no depende del color ni del icono. */
  estado: string;
  tono: Tono;
  icono: LucideIcon;
  /** Fecha ya formateada. */
  fecha?: string | null;
  detalle?: ReactNode;
}

/** Pasos con puntos de 24 px de DESIGN.md (línea de tiempo del anclaje y seguimiento del pago). */
export function LineaTiempo({ etiqueta, pasos }: { etiqueta: string; pasos: PasoLineaTiempo[] }) {
  return (
    <ol aria-label={etiqueta} className="m-0 grid basis-full list-none gap-2 p-0">
      {pasos.map(({ titulo, estado, tono, icono: Icono, fecha, detalle }) => (
        <li key={titulo} className="flex items-start gap-2.5">
          <span
            data-tono={tono}
            aria-hidden="true"
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full',
              CLASES_TONO[tono],
            )}
          >
            <Icono className="size-3.5" />
          </span>
          <span className="min-w-0 text-label">
            <span className="block font-semibold break-words">{titulo}</span>
            <span className="block text-muted-foreground">
              {estado}
              {fecha ? (
                <>
                  {' '}
                  · <span className="cifra">{fecha}</span>
                </>
              ) : null}
            </span>
            {detalle}
          </span>
        </li>
      ))}
    </ol>
  );
}
