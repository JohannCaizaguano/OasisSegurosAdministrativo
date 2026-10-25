import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AvisoError, EsqueletoTabla } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
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
import { useAuthStore } from '@/lib/auth-store';
import { formatearFecha } from '@/lib/format';

import { usePorValidar, useResumenPagos, useResumenRecibos } from '../hooks';
import { SaludAnclaje } from './SaludAnclaje';

function Cifra({ titulo, valor, pie }: { titulo: string; valor: ReactNode; pie: string }) {
  return (
    <Card className="flex flex-col gap-1.5 p-[18px]">
      <h2 className="font-sans text-label font-normal text-muted-foreground">{titulo}</h2>
      <p className="cifra text-cifra font-bold">{valor}</p>
      <p className="text-caption text-muted-foreground">{pie}</p>
    </Card>
  );
}

/** Inicio del personal (The Task First Rule): primero lo que hay que validar, luego el resto. */
export function PanelPersonal() {
  const porValidar = usePorValidar();
  const pagos = useResumenPagos();
  const recibos = useResumenRecibos();
  // DESIGN.md: lo que es solo del administrador se oculta al operador, no se deshabilita.
  const esAdmin = useAuthStore((estado) => estado.usuario?.rol === 'ADMIN');
  const verificables =
    recibos.data?.data.filter((recibo) => recibo.estado === 'ANCLADO').length ?? 0;

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <section
          data-superficie="noche"
          aria-labelledby="cifra-por-validar"
          className="flex flex-col gap-1.5 rounded-lg bg-sidebar bg-[image:var(--night-glow)] p-[18px] text-sidebar-foreground shadow-noche"
        >
          <h2
            id="cifra-por-validar"
            className="font-sans text-label font-normal text-sidebar-foreground"
          >
            Por validar
          </h2>
          <p
            className="cifra text-cifra font-bold text-sidebar-primary"
            data-testid="cifra-por-validar"
          >
            {porValidar.data?.meta.total ?? '…'}
          </p>
          <Link
            to="/pagos"
            className="mt-auto inline-flex min-h-control items-center self-start font-semibold text-sidebar-primary underline underline-offset-3"
          >
            Revisar los pagos
          </Link>
        </section>
        <Cifra
          titulo="Pagos registrados"
          valor={pagos.data?.meta.total ?? '…'}
          pie="En todos los estados"
        />
        <Cifra
          titulo="Recibos emitidos"
          valor={recibos.data?.meta.total ?? '…'}
          pie={`Verificables entre los últimos 5: ${verificables}`}
        />
      </div>

      {esAdmin && <SaludAnclaje />}

      <Card className="min-w-0">
        <CardHeader className="flex-row flex-wrap items-baseline justify-between gap-2 pb-3">
          <CardTitle>Últimos recibos</CardTitle>
          <Link to="/recibos" className="font-semibold text-link underline underline-offset-3">
            Ver todos los recibos
          </Link>
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
                    <TableCell className="cifra font-semibold">{recibo.codigo}</TableCell>
                    <TableCell>
                      <EstadoInsignia dominio="recibo" estado={recibo.estado} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatearFecha(recibo.ancladoEn)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        className="inline-flex min-h-control items-center font-semibold text-link underline underline-offset-3"
                        to={`/recibos/${recibo.id}`}
                        aria-label={`Ver el recibo ${recibo.codigo}`}
                      >
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
