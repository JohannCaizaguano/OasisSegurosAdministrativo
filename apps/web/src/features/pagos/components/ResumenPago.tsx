import type { Pago } from '@oasis/shared';
import { ETIQUETAS_METODO_PAGO } from '@oasis/shared';

import { formatearFecha, formatearMoneda } from '@/lib/format';

/** Datos del pago que se revisan antes de validarlo o rechazarlo. */
export function ResumenPago({ pago }: { pago: Pago }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-md bg-secondary p-3.5">
      <dt className="text-muted-foreground">Póliza</dt>
      <dd className="cifra text-right font-semibold">{pago.numeroPoliza ?? '—'}</dd>
      <dt className="text-muted-foreground">Monto</dt>
      <dd className="cifra text-right font-semibold">{formatearMoneda(pago.monto)}</dd>
      <dt className="text-muted-foreground">Fecha</dt>
      <dd className="cifra text-right font-semibold">{formatearFecha(pago.fechaPago)}</dd>
      <dt className="text-muted-foreground">Método</dt>
      <dd className="text-right font-semibold">{ETIQUETAS_METODO_PAGO[pago.metodo]}</dd>
      <dt className="text-muted-foreground">Referencia</dt>
      <dd className="text-right font-semibold">{pago.referencia ?? '—'}</dd>
    </dl>
  );
}
