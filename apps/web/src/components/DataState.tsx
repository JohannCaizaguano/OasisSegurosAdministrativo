import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** Estados de carga, error y vacío compartidos por las páginas de datos. */
export function EsqueletoTabla({ filas = 3 }: { filas?: number }) {
  return (
    <div className="grid gap-2" aria-hidden="true">
      {Array.from({ length: filas }, (_, indice) => (
        <Skeleton key={indice} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function AvisoError({ error, alReintentar }: { error: unknown; alReintentar?: () => void }) {
  const mensaje =
    error instanceof Error && error.message
      ? error.message
      : 'No fue posible cargar los datos. Verifique su conexión e intente de nuevo.';

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-md bg-estado-error-fondo px-4 py-3 text-estado-error"
    >
      <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 font-medium">{mensaje}</p>
      {alReintentar ? (
        <Button type="button" size="sm" variant="secondary" onClick={alReintentar}>
          <RefreshCw aria-hidden="true" />
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

interface AvisoVacioProps {
  children: string;
  descripcion?: string;
  accion?: ReactNode;
}

export function AvisoVacio({ children, descripcion, accion }: AvisoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md bg-secondary px-4 py-8 text-center">
      <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className={descripcion ? 'font-semibold' : 'text-muted-foreground'}>{children}</p>
      {descripcion ? <p className="max-w-prose text-muted-foreground">{descripcion}</p> : null}
      {accion ? <div className="mt-1">{accion}</div> : null}
    </div>
  );
}
