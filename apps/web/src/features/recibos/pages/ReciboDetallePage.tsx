import type { ReciboDetalle } from '@oasis/shared';
import { Printer, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AvisoError } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { Encabezado } from '@/components/layout/Encabezado';
import { Migas } from '@/components/layout/Migas';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/auth-store';
import { formatearFecha } from '@/lib/format';

import { LineaTiempoAnclaje } from '../components/LineaTiempoAnclaje';
import { TarjetaVerificacion } from '../components/TarjetaVerificacion';
import { useReintentarRecibo, useRecibo, useUltimoReintento } from '../hooks';

const RECIBOS = { a: '/recibos', texto: 'Recibos' };

function Dato({
  termino,
  children,
  ancho = false,
  tecnico = false,
  testId,
}: {
  termino: string;
  children: ReactNode;
  ancho?: boolean;
  tecnico?: boolean;
  testId?: string;
}) {
  return (
    <div className={ancho ? 'sm:col-span-2' : undefined}>
      <dt className="text-caption text-muted-foreground">{termino}</dt>
      <dd
        className={tecnico ? 'font-mono text-caption break-all' : 'font-semibold'}
        data-testid={testId}
      >
        {children}
      </dd>
    </div>
  );
}

/** HU-26 (D10): solo el ADMIN reintenta, solo un recibo FALLIDO y tras confirmar. */
function Reintento({ recibo }: { recibo: ReciboDetalle }) {
  const esAdmin = useAuthStore((estado) => estado.usuario?.rol === 'ADMIN');
  const ultimo = useUltimoReintento(recibo.id, esAdmin);
  const reintentar = useReintentarRecibo();

  if (!esAdmin) {
    return null;
  }

  return (
    <div className="grid gap-2">
      {recibo.estado === 'FALLIDO' ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" className="justify-self-start">
              <RotateCcw aria-hidden="true" /> Reintentar anclaje
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Reintentar el recibo {recibo.codigo}?</AlertDialogTitle>
              <AlertDialogDescription>
                El recibo vuelve a «En proceso» y se vuelve a encolar para registrarlo. El reintento
                queda en la bitácora con su nombre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => reintentar.mutate(recibo.id)}
                disabled={reintentar.isPending}
              >
                Reintentar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      {ultimo.data ? (
        <p className="text-caption text-muted-foreground">
          Último reintento: {ultimo.data.usuarioEmail},{' '}
          <span className="cifra">{formatearFecha(ultimo.data.creadoEn)}</span>
        </p>
      ) : null}
    </div>
  );
}

export function ReciboDetallePage() {
  const { id } = useParams<{ id: string }>();
  const consulta = useRecibo(id);
  const recibo = consulta.data;

  if (consulta.isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // `!recibo` también es cierto cuando la consulta falló.
  if (consulta.isError || !recibo) {
    return (
      <div className="grid gap-4">
        <Migas anterior={RECIBOS} actual="Recibo" />
        <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Migas anterior={RECIBOS} actual={recibo.codigo} />
        <Encabezado titulo={`Recibo ${recibo.codigo}`}>
          <EstadoInsignia dominio="recibo" estado={recibo.estado} data-testid="estado-recibo" />
          <Button asChild variant="secondary">
            <Link to={`/recibos/${recibo.id}/imprimir`}>
              <Printer aria-hidden="true" /> Imprimir
            </Link>
          </Button>
        </Encabezado>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid min-w-0 content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado del anclaje</CardTitle>
              <CardDescription>
                Se actualiza solo cada 10 segundos mientras el registro está en curso.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <LineaTiempoAnclaje recibo={recibo} />
              <Reintento recibo={recibo} />
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Datos del recibo</CardTitle>
              <CardDescription>
                Red de anclaje: {recibo.chainId === 31337 ? 'Hardhat local' : 'Polygon Amoy'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
                <Dato termino="Póliza">
                  <span className="cifra">{recibo.numeroPoliza}</span>
                </Dato>
                <Dato termino="Pago (id)" tecnico>
                  {recibo.pagoId}
                </Dato>
                <Dato termino="Emitido">{formatearFecha(recibo.creadoEn)}</Dato>
                <Dato termino="Anclado" testId="fecha-anclado">
                  {formatearFecha(recibo.ancladoEn)}
                </Dato>
                <Dato termino="idOnchain" ancho tecnico>
                  {recibo.idOnchain}
                </Dato>
                <Dato termino="hashRecibo (keccak256 con sal)" ancho tecnico testId="hash-recibo">
                  {recibo.hashRecibo}
                </Dato>
                <Dato termino="Transacción" ancho tecnico>
                  {recibo.txHash ?? 'pendiente'}
                </Dato>
                <Dato termino="Bloque">{recibo.blockNumber ?? '—'}</Dato>
                <Dato termino="Gas usado">{recibo.gasUsed ?? '—'}</Dato>
              </dl>
            </CardContent>
          </Card>
        </div>

        <TarjetaVerificacion codigo={recibo.codigo} hashRecibo={recibo.hashRecibo} />
      </div>
    </div>
  );
}
