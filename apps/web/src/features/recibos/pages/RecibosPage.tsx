import type { EstadoRecibo } from '@oasis/shared';
import { Link } from 'react-router-dom';

import { AvisoError, EsqueletoTabla } from '@/components/DataState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatearFecha } from '@/lib/format';

import { useRecibos } from '../hooks';

function varianteEstado(estado: EstadoRecibo) {
  if (estado === 'ANCLADO') return 'success' as const;
  if (estado === 'FALLIDO' || estado === 'ANULADO') return 'destructive' as const;
  return 'warning' as const;
}

export function RecibosPage() {
  const consulta = useRecibos({ page: 1, pageSize: 50 });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Recibos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Recibos emitidos y su estado de anclaje en Polygon. La lista se actualiza sola.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {consulta.data ? `${consulta.data.meta.total} recibos` : 'Recibos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consulta.isLoading ? (
            <EsqueletoTabla />
          ) : consulta.isError ? (
            <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>txHash</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Anclado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.data.length === 0 && (
                  <TableEmpty mensaje="Todavía no hay recibos emitidos" />
                )}
                {consulta.data?.data.map((recibo) => (
                  <TableRow key={recibo.id} data-testid={`fila-recibo-${recibo.codigo}`}>
                    <TableCell className="font-mono text-xs">{recibo.codigo}</TableCell>
                    <TableCell>
                      <Badge variant={varianteEstado(recibo.estado)}>{recibo.estado}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-mono text-xs">
                      {recibo.txHash ?? '—'}
                    </TableCell>
                    <TableCell>{formatearFecha(recibo.creadoEn)}</TableCell>
                    <TableCell>{formatearFecha(recibo.ancladoEn)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          to={`/recibos/${recibo.id}`}
                          data-testid={`enlace-recibo-${recibo.codigo}`}
                        >
                          Ver detalle
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
