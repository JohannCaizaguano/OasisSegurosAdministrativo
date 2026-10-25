import type { Pago } from '@oasis/shared';
import { MOTIVOS_RECHAZO_FRECUENTES } from '@oasis/shared';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { ResumenPago } from './ResumenPago';

const MINIMO = 5;
const MAXIMO = 300;

interface Props {
  pago: Pago;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
  alConfirmar: (datos: { motivo: string }) => void;
  enCurso: boolean;
}

/**
 * HU-19 (D10): el motivo es obligatorio (5 a 300) y el cliente lo verá en su portal. Los chips
 * rellenan el texto, que sigue editable; «Rechazar pago» va en rojo sólido porque no se deshace.
 */
export function RechazarPagoDialog({
  pago,
  abierto,
  alCambiarAbierto,
  alConfirmar,
  enCurso,
}: Props) {
  const baseId = useId();
  const [motivo, setMotivo] = useState('');
  const recortado = motivo.trim();
  const esValido = recortado.length >= MINIMO && recortado.length <= MAXIMO;
  const idMotivo = `${baseId}-motivo`;
  const idAyuda = `${baseId}-ayuda`;

  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar pago</DialogTitle>
          <DialogDescription>
            El pago quedará rechazado, no emitirá recibo y ya no podrá validarse.{' '}
            <strong>El cliente verá el motivo en su portal.</strong>
          </DialogDescription>
        </DialogHeader>

        <ResumenPago pago={pago} />

        <form
          noValidate
          className="grid gap-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (esValido) alConfirmar({ motivo: recortado });
          }}
        >
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-label font-semibold">Motivos frecuentes</legend>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS_RECHAZO_FRECUENTES.map((frecuente) => {
                const elegido = motivo === frecuente;
                return (
                  <button
                    key={frecuente}
                    type="button"
                    aria-pressed={elegido}
                    onClick={() => setMotivo(frecuente)}
                    className={cn(
                      'inline-flex min-h-control items-center rounded-full border px-3.5 text-left text-label transition-colors',
                      elegido
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-input bg-card text-foreground hover:bg-secondary',
                    )}
                  >
                    {frecuente}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-1.5">
            <Label htmlFor={idMotivo}>
              Motivo del rechazo <span aria-hidden="true">*</span>
            </Label>
            <textarea
              id={idMotivo}
              value={motivo}
              maxLength={MAXIMO}
              rows={3}
              required
              aria-describedby={idAyuda}
              onChange={(evento) => setMotivo(evento.target.value)}
              className="min-h-24 w-full rounded-md border border-input bg-card px-[14px] py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-2 focus-visible:border-foreground focus-visible:px-[13px] focus-visible:py-[11px] focus-visible:shadow-[0_0_0_4px_var(--anillo-campo)] focus-visible:outline-none"
            />
            <p
              id={idAyuda}
              className="flex justify-between gap-3 text-caption text-muted-foreground"
            >
              <span>Entre 5 y 300 caracteres; el cliente lo leerá tal cual.</span>
              <span className="cifra" aria-live="polite">
                {recortado.length}/{MAXIMO}
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="quiet"
              onClick={() => alCambiarAbierto(false)}
              disabled={enCurso}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={enCurso || !esValido}
              aria-busy={enCurso}
              data-testid="confirmar-rechazar"
            >
              {enCurso ? 'Rechazando…' : 'Rechazar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
