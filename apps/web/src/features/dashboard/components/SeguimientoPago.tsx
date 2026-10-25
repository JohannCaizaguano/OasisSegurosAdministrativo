import type { Pago } from '@oasis/shared';
import { Check, Circle, Clock, X, type LucideIcon } from 'lucide-react';

import { CLASES_TONO, type Tono } from '@/components/estados';
import { formatearSoloFecha } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Paso {
  titulo: string;
  estado: string;
  tono: Tono;
  icono: LucideIcon;
  fecha?: string | null;
  motivo?: string | null;
}

function pasosDe(pago: Pago): Paso[] {
  const registrado: Paso = {
    titulo: 'Registrado',
    estado: 'Completado',
    tono: 'exito',
    icono: Check,
    fecha: pago.createdAt,
  };
  if (pago.estado === 'REGISTRADO') {
    return [
      registrado,
      {
        titulo: 'En revisión por Oasis Seguros',
        estado: 'En curso',
        tono: 'proceso',
        icono: Clock,
      },
      { titulo: 'Resultado', estado: 'Pendiente', tono: 'neutro', icono: Circle },
    ];
  }
  const revision: Paso = {
    titulo: 'En revisión por Oasis Seguros',
    estado: 'Completado',
    tono: 'exito',
    icono: Check,
  };
  if (pago.estado === 'VALIDADO') {
    return [
      registrado,
      revision,
      {
        titulo: 'Validado · recibo verificable',
        estado: 'Completado',
        tono: 'exito',
        icono: Check,
        fecha: pago.validadoEn,
      },
    ];
  }
  return [
    registrado,
    revision,
    {
      titulo: 'Rechazado',
      estado: 'Rechazado',
      tono: 'error',
      icono: X,
      fecha: pago.rechazadoEn,
      motivo: pago.motivoRechazo,
    },
  ];
}

/** Los tres pasos de un pago para el cliente: el estado va en texto, no solo en color e icono. */
export function SeguimientoPago({ pago }: { pago: Pago }) {
  return (
    <ol aria-label="Seguimiento del pago" className="m-0 grid basis-full list-none gap-2 p-0">
      {pasosDe(pago).map(({ titulo, estado, tono, icono: Icono, fecha, motivo }) => (
        <li key={titulo} className="flex items-start gap-2.5">
          <span
            data-tono={tono}
            aria-hidden="true"
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full',
              CLASES_TONO[tono],
            )}
          >
            <Icono className="size-3.5" />
          </span>
          <span className="min-w-0 text-label">
            <span className="block font-semibold break-words">{titulo}</span>
            <span className="block text-muted-foreground">
              {estado}
              {fecha ? (
                <>
                  {' '}
                  · <span className="cifra">{formatearSoloFecha(fecha)}</span>
                </>
              ) : null}
            </span>
            {motivo ? (
              <span className="mt-1 block break-words text-estado-error">
                <span className="font-semibold">Motivo del rechazo: </span>
                {motivo}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
