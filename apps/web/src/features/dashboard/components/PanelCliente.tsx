import type { Pago, Poliza } from '@oasis/shared';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AvisoError, AvisoVacio, EsqueletoTabla } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { Button } from '@/components/ui/button';
import { formatearFecha, formatearMoneda } from '@/lib/format';

import { useMisPagos, useMisPolizas } from '../hooks';

const CLASES_ACCION_CONTORNO =
  'border border-sidebar-foreground/30 bg-transparent text-sidebar-foreground shadow-none hover:bg-sidebar-accent';

/**
 * Héroe del portal (DESIGN.md, signature): lo urgente primero. Un pago por validar manda; si no
 * hay, el resumen de sus pólizas vigentes.
 */
function Heroe({ polizas, pagos }: { polizas: Poliza[]; pagos: Pago[] }) {
  const enValidacion = pagos.find((pago) => pago.estado === 'REGISTRADO');
  const vigentes = polizas.filter((poliza) => poliza.estado === 'VIGENTE').length;

  return (
    <section
      data-superficie="noche"
      aria-labelledby="heroe-titulo"
      className="flex animate-panel flex-col gap-1.5 rounded-lg bg-sidebar bg-[image:var(--night-glow)] p-[18px] text-sidebar-foreground shadow-noche riel:p-5"
    >
      {enValidacion ? (
        <>
          <EstadoInsignia dominio="pago" estado="REGISTRADO" />
          <h2
            id="heroe-titulo"
            className="mt-1 font-sans text-cuerpo font-normal text-sidebar-foreground"
          >
            Pago de la póliza {enValidacion.numeroPoliza ?? ''} ·{' '}
            {formatearFecha(enValidacion.fechaPago)}
          </h2>
          <p className="cifra text-heroe font-bold text-sidebar-primary">
            {formatearMoneda(enValidacion.monto)}
          </p>
          <p className="text-sidebar-foreground">
            Oasis Seguros está revisando este pago. Aquí verá el resultado.
          </p>
        </>
      ) : (
        <>
          <h2
            id="heroe-titulo"
            className="font-sans text-cuerpo font-normal text-sidebar-foreground"
          >
            Pólizas vigentes
          </h2>
          <p className="cifra text-heroe font-bold text-sidebar-primary">{vigentes}</p>
          <p className="text-sidebar-foreground">
            {vigentes > 0
              ? 'Sus pólizas están al día en Oasis Seguros.'
              : 'No tiene pólizas vigentes en este momento.'}
          </p>
        </>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button asChild className="min-h-12 font-bold">
          <Link to={enValidacion ? '/#pagos' : '/#polizas'}>
            {enValidacion ? 'Ver mis pagos' : 'Ver mis pólizas'}
          </Link>
        </Button>
        <Button asChild variant="secondary" className={`min-h-12 ${CLASES_ACCION_CONTORNO}`}>
          <Link to={enValidacion ? '/#polizas' : '/#pagos'}>
            {enValidacion ? 'Ver mis pólizas' : 'Ver mis pagos'}
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** Panel del asegurado (rol CLIENTE): solo sus pólizas y sus pagos. */
export function PanelCliente() {
  const polizas = useMisPolizas();
  const pagos = useMisPagos();
  const listaPolizas = polizas.data?.data ?? [];
  const listaPagos = pagos.data?.data ?? [];

  return (
    <div className="grid gap-6">
      {polizas.data && pagos.data ? <Heroe polizas={listaPolizas} pagos={listaPagos} /> : null}

      <section id="polizas" aria-labelledby="titulo-polizas" className="grid scroll-mt-4 gap-3">
        <h2 id="titulo-polizas" className="text-title font-bold">
          Mis pólizas
        </h2>
        {polizas.isLoading ? (
          <EsqueletoTabla />
        ) : polizas.isError ? (
          <AvisoError error={polizas.error} alReintentar={() => void polizas.refetch()} />
        ) : listaPolizas.length === 0 ? (
          <AvisoVacio>Sin pólizas</AvisoVacio>
        ) : (
          <ul className="grid gap-2.5">
            {listaPolizas.map((poliza) => (
              <li
                key={poliza.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{poliza.ramo}</span>
                    <EstadoInsignia dominio="poliza" estado={poliza.estado} />
                  </span>
                  <span className="text-label text-muted-foreground">
                    <span className="cifra">{poliza.numero}</span> · vigencia{' '}
                    <span className="cifra">
                      {formatearFecha(poliza.fechaInicio)} – {formatearFecha(poliza.fechaFin)}
                    </span>
                  </span>
                </div>
                <span className="ml-auto text-right">
                  <span className="block text-caption text-muted-foreground">Prima</span>
                  <span className="cifra text-title font-bold">
                    {formatearMoneda(poliza.primaTotal)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="pagos" aria-labelledby="titulo-pagos" className="grid scroll-mt-4 gap-3">
        <h2 id="titulo-pagos" className="text-title font-bold">
          Mis pagos
        </h2>
        {pagos.isLoading ? (
          <EsqueletoTabla />
        ) : pagos.isError ? (
          <AvisoError error={pagos.error} alReintentar={() => void pagos.refetch()} />
        ) : listaPagos.length === 0 ? (
          <AvisoVacio>Sin pagos</AvisoVacio>
        ) : (
          <ul className="grid gap-2.5">
            {listaPagos.map((pago, indice) => (
              <li
                key={pago.id}
                style={{ animationDelay: `${indice * 30}ms` }}
                className="flex animate-fila flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                  <span className="font-semibold">
                    Póliza <span className="cifra">{pago.numeroPoliza ?? '—'}</span>
                  </span>
                  <span className="cifra text-label text-muted-foreground">
                    {formatearFecha(pago.fechaPago)}
                  </span>
                </div>
                <span className="ml-auto flex flex-col items-end gap-1">
                  <span className="cifra text-title font-bold">{formatearMoneda(pago.monto)}</span>
                  <EstadoInsignia dominio="pago" estado={pago.estado} />
                </span>
                {pago.estado === 'RECHAZADO' && pago.motivoRechazo && (
                  <p className="basis-full rounded-md bg-estado-error-fondo px-3 py-2 text-label text-estado-error">
                    <span className="font-semibold">Motivo del rechazo: </span>
                    {pago.motivoRechazo}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="flex items-start gap-2 text-label text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-estado-exito" aria-hidden="true" />
          Cada pago validado emite un recibo verificable de Oasis Seguros.
        </p>
      </section>
    </div>
  );
}
