import type { EstadoPoliza } from '@oasis/shared';

import { AvisoError, EsqueletoTabla } from '@/components/DataState';
import { Badge } from '@/components/ui/badge';
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
import { formatearFecha, formatearMoneda } from '@/lib/format';

import { usePolizas } from '../hooks';

function varianteEstado(estado: EstadoPoliza) {
  if (estado === 'VIGENTE') return 'success' as const;
  if (estado === 'CANCELADA') return 'destructive' as const;
  return 'warning' as const;
}

export function PolizasPage() {
  const consulta = usePolizas();

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Pólizas</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Pólizas colocadas por el bróker y su estado de vigencia.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {consulta.data ? `${consulta.data.meta.total} pólizas` : 'Pólizas'}
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
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Ramo</TableHead>
                  <TableHead className="text-right">Prima</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.data.length === 0 && (
                  <TableEmpty mensaje="Sin pólizas registradas" />
                )}
                {consulta.data?.data.map((poliza) => (
                  <TableRow key={poliza.id}>
                    <TableCell className="font-mono text-xs">{poliza.numero}</TableCell>
                    <TableCell>{poliza.clienteNombre ?? '—'}</TableCell>
                    <TableCell>{poliza.aseguradoraNombre ?? '—'}</TableCell>
                    <TableCell>{poliza.ramo}</TableCell>
                    <TableCell className="text-right">
                      {formatearMoneda(poliza.primaTotal)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatearFecha(poliza.fechaInicio)} — {formatearFecha(poliza.fechaFin)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={varianteEstado(poliza.estado)}>{poliza.estado}</Badge>
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
