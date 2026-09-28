import { AvisoError, EsqueletoTabla } from '@/components/data-state';
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

import { useMisPagos, useMisPolizas } from '../hooks';

/** Panel del asegurado (rol CLIENTE): solo sus pólizas y sus pagos. */
export function PanelCliente() {
  const polizas = useMisPolizas();
  const pagos = useMisPagos();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis pólizas</CardTitle>
        </CardHeader>
        <CardContent>
          {polizas.isLoading ? (
            <EsqueletoTabla />
          ) : polizas.isError ? (
            <AvisoError error={polizas.error} alReintentar={() => void polizas.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Ramo</TableHead>
                  <TableHead className="text-right">Prima</TableHead>
                  <TableHead>Vigencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polizas.data?.data.length === 0 && <TableEmpty mensaje="Sin pólizas" />}
                {polizas.data?.data.map((poliza) => (
                  <TableRow key={poliza.id}>
                    <TableCell className="font-mono text-xs">{poliza.numero}</TableCell>
                    <TableCell>{poliza.ramo}</TableCell>
                    <TableCell className="text-right">
                      {formatearMoneda(poliza.primaTotal)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatearFecha(poliza.fechaInicio)} — {formatearFecha(poliza.fechaFin)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {pagos.isLoading ? (
            <EsqueletoTabla />
          ) : pagos.isError ? (
            <AvisoError error={pagos.error} alReintentar={() => void pagos.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Póliza</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.data?.data.length === 0 && <TableEmpty mensaje="Sin pagos" />}
                {pagos.data?.data.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>{formatearFecha(pago.fechaPago)}</TableCell>
                    <TableCell className="font-mono text-xs">{pago.numeroPoliza}</TableCell>
                    <TableCell className="text-right">{formatearMoneda(pago.monto)}</TableCell>
                    <TableCell>
                      <Badge variant={pago.estado === 'VALIDADO' ? 'success' : 'warning'}>
                        {pago.estado}
                      </Badge>
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
