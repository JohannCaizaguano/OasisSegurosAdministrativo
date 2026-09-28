import type { Pago, Poliza, ReciboResumen, RespuestaPaginada } from '@oasis/shared';
import { useQuery } from '@tanstack/react-query';
import { FileText, Receipt, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { formatearFecha, formatearMoneda } from '@/lib/format';

function TarjetaResumen({
  titulo,
  valor,
  icono: Icono,
}: {
  titulo: string;
  valor: number | string;
  icono: typeof FileText;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5">
        <span className="rounded-lg bg-[var(--accent)] p-2">
          <Icono className="size-5 text-[var(--primary)]" />
        </span>
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{titulo}</p>
          <p className="text-2xl font-semibold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PanelPersonal() {
  const pagos = useQuery({
    queryKey: ['pagos', 'resumen'],
    queryFn: () => api.get<RespuestaPaginada<Pago>>('/pagos?page=1&pageSize=5'),
  });
  const recibos = useQuery({
    queryKey: ['recibos', 'resumen'],
    queryFn: () => api.get<RespuestaPaginada<ReciboResumen>>('/recibos?page=1&pageSize=5'),
  });
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
            <Skeleton className="h-10 w-full" />
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

function PanelCliente() {
  const polizas = useQuery({
    queryKey: ['mis-polizas'],
    queryFn: () => api.get<RespuestaPaginada<Poliza>>('/mis-polizas?page=1&pageSize=20'),
  });
  const pagos = useQuery({
    queryKey: ['mis-pagos'],
    queryFn: () => api.get<RespuestaPaginada<Pago>>('/mis-pagos?page=1&pageSize=20'),
  });

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis pólizas</CardTitle>
        </CardHeader>
        <CardContent>
          {polizas.isLoading ? (
            <Skeleton className="h-10 w-full" />
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
            <Skeleton className="h-10 w-full" />
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

export function DashboardPage() {
  const usuario = useAuthStore((estado) => estado.usuario);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {usuario?.nombre}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {usuario?.rol === 'CLIENTE'
            ? 'Consulte sus pólizas y el estado de sus pagos.'
            : 'Resumen operativo del bróker.'}
        </p>
      </div>
      {usuario?.rol === 'CLIENTE' ? <PanelCliente /> : <PanelPersonal />}
    </div>
  );
}
