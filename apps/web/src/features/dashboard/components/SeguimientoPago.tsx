import type { Pago } from '@oasis/shared';
import { Check, Circle, Clock, X, type LucideIcon } from 'lucide-react';

import type { Tono } from '@/components/estados';
import { LineaTiempo } from '@/components/LineaTiempo';
import { formatearSoloFecha } from '@/lib/format';

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
    <LineaTiempo
      etiqueta="Seguimiento del pago"
      pasos={pasosDe(pago).map(({ fecha, motivo, ...paso }) => ({
        ...paso,
        fecha: fecha ? formatearSoloFecha(fecha) : null,
        detalle: motivo ? (
          <span className="mt-1 block break-words text-estado-error">
            <span className="font-semibold">Motivo del rechazo: </span>
            {motivo}
          </span>
        ) : null,
      }))}
    />
  );
}
