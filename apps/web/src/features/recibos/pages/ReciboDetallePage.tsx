import { ExternalLink, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AvisoError } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { Encabezado } from '@/components/layout/Encabezado';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatearFecha } from '@/lib/format';

import { useRecibo } from '../hooks';
import { TarjetaVerificacion } from '../components/TarjetaVerificacion';

/** Migas de pan de la subpágina (DESIGN.md §Navigation): el tramo anterior es un enlace. */
function Migas({ actual }: { actual: string }) {
  return (
    <nav aria-label="Migas de pan" className="text-label text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/recibos" className="font-semibold text-link underline underline-offset-3">
            Recibos
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="cifra">
          {actual}
        </li>
      </ol>
    </nav>
  );
}

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
        <Migas actual="Recibo" />
        <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Migas actual={recibo.codigo} />
        <Encabezado titulo={`Recibo ${recibo.codigo}`}>
          <EstadoInsignia dominio="recibo" estado={recibo.estado} data-testid="estado-recibo" />
        </Encabezado>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Datos del recibo</CardTitle>
            <CardDescription>
              Anclado en la red {recibo.chainId === 31337 ? 'Hardhat local' : 'Polygon Amoy'}
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

            {recibo.explorerUrl && (
              <a
                className="inline-flex min-h-control items-center gap-1.5 self-start font-semibold text-link underline underline-offset-3"
                href={recibo.explorerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver transacción en el explorador
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            )}
            {recibo.ultimoError && (
              <p className="flex items-start gap-2.5 rounded-md bg-estado-aviso-fondo px-3.5 py-3 text-estado-aviso">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  Último error ({recibo.intentos} intentos): {recibo.ultimoError}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        <TarjetaVerificacion codigo={recibo.codigo} hashRecibo={recibo.hashRecibo} />
      </div>
    </div>
  );
}
