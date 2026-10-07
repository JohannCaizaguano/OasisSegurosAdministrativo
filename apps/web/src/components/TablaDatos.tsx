import type { ReactNode } from 'react';

import { AvisoError, AvisoVacio, EsqueletoTabla } from '@/components/DataState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TablaDatosProps {
  titulo: string;
  cargando: boolean;
  error: unknown;
  alReintentar: () => void;
  vacio: string;
  hayDatos: boolean;
  children: ReactNode;
}

/** Card con los estados carga → error → vacío → tabla; las filas llegan como children. */
export function TablaDatos({
  titulo,
  cargando,
  error,
  alReintentar,
  vacio,
  hayDatos,
  children,
}: TablaDatosProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <EsqueletoTabla />
        ) : error ? (
          <AvisoError error={error} alReintentar={alReintentar} />
        ) : hayDatos ? (
          children
        ) : (
          <AvisoVacio>{vacio}</AvisoVacio>
        )}
      </CardContent>
    </Card>
  );
}

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  cargando?: boolean;
  alCambiar: (pagina: number) => void;
}

export function Paginacion({ pagina, totalPaginas, cargando = false, alCambiar }: PaginacionProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted-foreground)]">
      <p>
        Página {pagina} de {totalPaginas}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Página anterior"
          disabled={pagina <= 1 || cargando}
          onClick={() => alCambiar(pagina - 1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Página siguiente"
          disabled={pagina >= totalPaginas || cargando}
          onClick={() => alCambiar(pagina + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
