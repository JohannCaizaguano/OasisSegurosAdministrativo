import { Link } from 'react-router-dom';

import { AvisoError, AvisoVacio, EsqueletoTabla } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { LeyendaEstados } from '@/components/LeyendaEstados';
import { Encabezado } from '@/components/layout/Encabezado';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatearFecha } from '@/lib/format';

import { useRecibos } from '../hooks';

export function RecibosPage() {
  const consulta = useRecibos({ page: 1, pageSize: 50 });

  return (
    <div className="grid gap-5">
      <Encabezado
        titulo="Recibos"
        descripcion="Recibos emitidos y el estado de su registro verificable. La lista se actualiza sola."
      />

      <LeyendaEstados dominio="recibo" />

      <Card className="min-w-0">
        <CardHeader className="pb-3">
          <CardTitle>{consulta.data ? `${consulta.data.meta.total} recibos` : 'Recibos'}</CardTitle>
        </CardHeader>
        <CardContent>
          {consulta.isLoading ? (
            <EsqueletoTabla />
          ) : consulta.isError ? (
            <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
          ) : consulta.data?.data.length === 0 ? (
            <AvisoVacio
              descripcion="Cada pago validado emite un recibo."
              accion={
                <Link
                  to="/pagos"
                  className="inline-flex min-h-control items-center font-semibold text-link underline underline-offset-3"
                >
                  Ir a Pagos
                </Link>
              }
            >
              Sin recibos todavía
            </AvisoVacio>
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
                {consulta.data?.data.map((recibo) => (
                  <TableRow key={recibo.id} data-testid={`fila-recibo-${recibo.codigo}`}>
                    <TableCell className="cifra font-semibold whitespace-nowrap">
                      {recibo.codigo}
                    </TableCell>
                    <TableCell>
                      <EstadoInsignia dominio="recibo" estado={recibo.estado} />
                    </TableCell>
                    <TableCell
                      className="max-w-[180px] truncate font-mono text-caption text-muted-foreground"
                      title={recibo.txHash ?? undefined}
                    >
                      {recibo.txHash ?? '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatearFecha(recibo.creadoEn)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatearFecha(recibo.ancladoEn)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="quiet">
                        <Link
                          to={`/recibos/${recibo.id}`}
                          data-testid={`enlace-recibo-${recibo.codigo}`}
                          aria-label={`Ver detalle del recibo ${recibo.codigo}`}
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
