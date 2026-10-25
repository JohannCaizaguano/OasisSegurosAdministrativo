import { TriangleAlert } from 'lucide-react';

import { AvisoError } from '@/components/DataState';
import { formatearFecha } from '@/lib/format';
import { cn } from '@/lib/utils';

import { useSaldoOperadora } from '../hooks';

const POL = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 4 });

/**
 * HU-42 (DESIGN.md, Administración): saldo de la cuenta operadora en cifra dorada sobre la noche,
 * con una barra contra el umbral (que queda a la mitad) y un aviso con texto bajo el umbral.
 */
export function SaludAnclaje() {
  const consulta = useSaldoOperadora();
  const saldo = consulta.data;

  return (
    <section
      data-superficie="noche"
      aria-labelledby="titulo-salud-anclaje"
      className="flex animate-panel flex-col gap-3 rounded-lg bg-sidebar bg-[image:var(--night-glow)] p-5 text-sidebar-foreground shadow-noche"
    >
      <h2
        id="titulo-salud-anclaje"
        className="font-sans text-label font-normal text-sidebar-foreground"
      >
        Salud del anclaje
      </h2>

      {consulta.isError ? (
        <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
      ) : !saldo ? (
        <p className="text-sidebar-muted">Consultando el saldo…</p>
      ) : !saldo.disponible ? (
        <p className="text-sidebar-muted">Sin datos del saldo</p>
      ) : (
        <>
          <p
            className="cifra text-[40px] leading-none font-bold text-sidebar-primary"
            data-testid="saldo-operadora"
          >
            {POL.format(Number(saldo.pol))} POL
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-sidebar-accent" aria-hidden="true">
            <div
              className={cn(
                'h-full rounded-full',
                saldo.bajoUmbral ? 'bg-alerta-noche' : 'bg-sidebar-primary',
              )}
              style={{
                width: `${Math.min(100, (Number(saldo.pol) / Number(saldo.umbralPol)) * 50)}%`,
              }}
            />
          </div>
          <p className="flex flex-wrap justify-between gap-2 text-caption text-sidebar-muted">
            <span>Umbral {POL.format(Number(saldo.umbralPol))} POL</span>
            <span>Actualizado {formatearFecha(saldo.actualizadoEn)}</span>
          </p>
          {saldo.bajoUmbral && (
            <p role="alert" className="flex items-start gap-2 font-semibold text-alerta-noche">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Saldo bajo: recargue la cuenta operadora
            </p>
          )}
        </>
      )}
    </section>
  );
}
