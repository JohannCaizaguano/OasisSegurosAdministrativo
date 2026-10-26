import { CircleAlert, ListChecks } from 'lucide-react';

import { formatearMoneda } from '@/lib/format';

import type { VistaPrevia } from '../vista-previa';

/** «Al validar: …» en el diálogo; en el formulario, en condicional y solo informativa. */
export function AvisoVistaPrevia({
  vista,
  condicional = false,
}: {
  vista: VistaPrevia | null;
  condicional?: boolean;
}) {
  if (!vista) {
    return null;
  }
  if (vista.tipo === 'supera-saldo') {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-md bg-estado-error-fondo px-3.5 py-3 text-label text-estado-error"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Supera el saldo pendiente ({formatearMoneda(vista.pendiente)}).
      </p>
    );
  }
  return (
    <p
      // En el formulario la frase sigue cada tecla del monto: sin región viva para no repetirla.
      role={condicional ? undefined : 'status'}
      className="flex items-start gap-2 rounded-md bg-estado-proceso-fondo px-3.5 py-3 text-label text-estado-proceso"
    >
      <ListChecks className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {condicional
        ? `Este pago cubriría: ${vista.fraseCondicional}.`
        : `Al validar: ${vista.frase}.`}
    </p>
  );
}
