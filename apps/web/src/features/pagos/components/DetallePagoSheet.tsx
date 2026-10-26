import { ETIQUETAS_METODO_PAGO, type PagoDetalle } from '@oasis/shared';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AvisoError } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatearFecha, formatearMoneda } from '@/lib/format';

import { usePago } from '../hooks';

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{termino}</dt>
      <dd className="text-right font-semibold break-words">{children}</dd>
    </>
  );
}

function Contenido({ pago }: { pago: PagoDetalle }) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="cifra text-cifra font-bold">{formatearMoneda(pago.monto)}</span>
        <EstadoInsignia dominio="pago" estado={pago.estado} />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md bg-secondary p-3.5">
        <Dato termino="Póliza">
          <span className="cifra">{pago.numeroPoliza ?? '—'}</span>
        </Dato>
        <Dato termino="Fecha de pago">
          <span className="cifra">{formatearFecha(pago.fechaPago)}</span>
        </Dato>
        <Dato termino="Método">{ETIQUETAS_METODO_PAGO[pago.metodo]}</Dato>
        <Dato termino="Referencia">{pago.referencia ?? '—'}</Dato>
        {pago.validadoEn ? (
          <Dato termino="Validado">
            <span className="cifra">{formatearFecha(pago.validadoEn)}</span>
          </Dato>
        ) : null}
        {pago.rechazadoEn ? (
          <Dato termino="Rechazado">
            <span className="cifra">{formatearFecha(pago.rechazadoEn)}</span>
          </Dato>
        ) : null}
      </dl>

      {pago.motivoRechazo ? (
        <p className="break-words text-estado-error">
          <span className="font-semibold">Motivo del rechazo: </span>
          {pago.motivoRechazo}
        </p>
      ) : null}

      <section aria-labelledby="titulo-aplicaciones" className="grid gap-2">
        <h3 id="titulo-aplicaciones" className="text-title font-bold">
          Aplicación a cuotas
        </h3>
        {pago.aplicaciones.length === 0 ? (
          <p className="text-muted-foreground">
            {pago.estado === 'VALIDADO'
              ? 'Este pago no tiene cuotas aplicadas.'
              : 'Se aplicará a las cuotas pendientes cuando se valide.'}
          </p>
        ) : (
          <ul
            aria-label="Aplicación a cuotas"
            className="grid divide-y divide-border rounded-md bg-secondary"
          >
            {pago.aplicaciones.map((aplicacion) => (
              <li
                key={aplicacion.cuotaNumero}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <span className="font-semibold">Cuota {aplicacion.cuotaNumero}</span>
                <span className="cifra font-semibold">{formatearMoneda(aplicacion.monto)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pago.recibo ? (
        <section aria-labelledby="titulo-recibo-pago" className="grid gap-2">
          <h3 id="titulo-recibo-pago" className="text-title font-bold">
            Recibo
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/recibos/${pago.recibo.id}`}
              className="inline-flex min-h-control items-center font-semibold text-link underline underline-offset-3"
            >
              <span className="cifra">{pago.recibo.codigo}</span>
            </Link>
            <EstadoInsignia dominio="recibo" estado={pago.recibo.estado} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** HU-20 y HU-36 (D14): datos del pago, a qué cuotas se aplicó y su recibo. */
export function DetallePagoSheet({
  pagoId,
  alCerrar,
}: {
  pagoId: string | null;
  alCerrar: () => void;
}) {
  const consulta = usePago(pagoId ?? undefined);

  return (
    <Sheet open={pagoId !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <SheetContent lado="derecha" className="w-[440px] max-w-[92vw] gap-5 overflow-y-auto p-5">
        <div className="grid gap-1 pr-10">
          <SheetTitle className="text-title font-bold">Detalle del pago</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Datos del pago, las cuotas que cubrió y su recibo.
          </SheetDescription>
        </div>
        {consulta.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : consulta.data ? (
          <Contenido pago={consulta.data} />
        ) : (
          <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
        )}
      </SheetContent>
    </Sheet>
  );
}
