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
      className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-4 text-sm"
    >
      <AlertTriangle className="size-4 shrink-0 text-[var(--destructive)]" aria-hidden="true" />
      <p className="flex-1">{mensaje}</p>
      {alReintentar ? (
        <Button type="button" size="sm" variant="outline" onClick={alReintentar}>
          <RefreshCw className="size-3" aria-hidden="true" />
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export function AvisoVacio({ children }: { children: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <Inbox className="size-5 text-[var(--muted-foreground)]" aria-hidden="true" />
      <p className="text-sm text-[var(--muted-foreground)]">{children}</p>
    </div>
  );
}
