import { FileText, Receipt, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

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
import { formatearFecha } from '@/lib/format';

import { useResumenPagos, useResumenRecibos } from '../hooks';
import { TarjetaResumen } from './TarjetaResumen';

/** Resumen operativo para ADMIN y OPERADOR. */
export function PanelPersonal() {
  const pagos = useResumenPagos();
  const recibos = useResumenRecibos();
  const anclados = recibos.data?.data.filter((recibo) => recibo.estado === 'ANCLADO').length ?? 0;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaResumen
          titulo="Pagos registrados"
          valor={pagos.data?.meta.total ?? '…'}
          icono={FileText}
        />
        <TarjetaResumen
          titulo="Recibos emitidos"
          valor={recibos.data?.meta.total ?? '…'}
          icono={Receipt}
        />
        <TarjetaResumen
          titulo="Recibos anclados (últimos 5)"
          valor={anclados}
          icono={ShieldCheck}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos recibos</CardTitle>
        </CardHeader>
        <CardContent>
          {recibos.isLoading ? (
            <EsqueletoTabla />
          ) : recibos.isError ? (
            <AvisoError error={recibos.error} alReintentar={() => void recibos.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Anclado</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recibos.data?.data.length === 0 && <TableEmpty mensaje="Sin recibos todavía" />}
                {recibos.data?.data.map((recibo) => (
                  <TableRow key={recibo.id}>
                    <TableCell className="font-mono text-xs">{recibo.codigo}</TableCell>
                    <TableCell>
                      <Badge variant={recibo.estado === 'ANCLADO' ? 'success' : 'warning'}>
                        {recibo.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatearFecha(recibo.ancladoEn)}</TableCell>
                    <TableCell className="text-right">
                      <Link className="text-sm underline" to={`/recibos/${recibo.id}`}>
                        Ver
                      </Link>
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
