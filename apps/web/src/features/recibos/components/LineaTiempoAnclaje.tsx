import type { ReciboDetalle } from '@oasis/shared';
import { Ban, Check, Circle, Clock, ExternalLink, X } from 'lucide-react';

import { LineaTiempo, type PasoLineaTiempo } from '@/components/LineaTiempo';
import { formatearFecha } from '@/lib/format';

const MAX_ERROR = 160;

const COMPLETADO = { estado: 'Completado', tono: 'exito', icono: Check } as const;
const EN_CURSO = { estado: 'En curso', tono: 'proceso', icono: Clock } as const;
const PENDIENTE = { estado: 'Pendiente', tono: 'neutro', icono: Circle } as const;

function resumir(texto: string): string {
  return texto.length > MAX_ERROR ? `${texto.slice(0, MAX_ERROR)}…` : texto;
}

function pasoFinal(recibo: ReciboDetalle): PasoLineaTiempo {
  switch (recibo.estado) {
    case 'ANCLADO':
      return { titulo: 'Anclado', ...COMPLETADO, fecha: formatearFecha(recibo.ancladoEn) };
    case 'ENVIADO':
      return { titulo: 'Anclado', ...EN_CURSO };
    case 'FALLIDO':
      return {
        titulo: 'Fallido',
        estado: `Sin anclar tras ${recibo.intentos} intentos`,
        tono: 'error',
        icono: X,
        detalle: recibo.ultimoError ? (
          <span className="mt-1 block break-words text-estado-error">
            {resumir(recibo.ultimoError)}
          </span>
        ) : null,
      };
    case 'ANULADO':
      return {
        titulo: 'Anulado',
        estado: recibo.ancladoEn ? 'Anulado tras anclarse' : 'Anulado',
        tono: 'neutro',
        icono: Ban,
      };
    default:
      return { titulo: 'Anclado', ...PENDIENTE };
  }
}

function pasosDe(recibo: ReciboDetalle): PasoLineaTiempo[] {
  const enviado: PasoLineaTiempo = recibo.enviadoEn
    ? { titulo: 'Enviado', ...COMPLETADO, fecha: formatearFecha(recibo.enviadoEn) }
    : { titulo: 'Enviado', ...(recibo.estado === 'PENDIENTE_ANCLAJE' ? EN_CURSO : PENDIENTE) };
  return [
    { titulo: 'Creado', ...COMPLETADO, fecha: formatearFecha(recibo.creadoEn) },
    enviado,
    pasoFinal(recibo),
  ];
}

/** HU-24 (D9): creado, enviado y anclado o fallido, con el enlace a la transacción. */
export function LineaTiempoAnclaje({ recibo }: { recibo: ReciboDetalle }) {
  return (
    <div className="grid gap-3">
      <LineaTiempo etiqueta="Línea de tiempo del anclaje" pasos={pasosDe(recibo)} />
      {recibo.explorerUrl ? (
        <a
          className="inline-flex min-h-control items-center gap-1.5 self-start font-semibold text-link underline underline-offset-3"
          href={recibo.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver transacción
          <ExternalLink className="size-4" aria-hidden="true" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </a>
      ) : null}
    </div>
  );
}
