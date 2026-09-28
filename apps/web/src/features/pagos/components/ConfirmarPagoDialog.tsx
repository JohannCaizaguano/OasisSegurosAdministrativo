import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useEffect, useId } from 'react';
import type { Pago } from '@oasis/shared';
import { rechazarPagoSchema, validarPagoSchema } from '@oasis/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatearMoneda } from '@/lib/format';

export type AccionPago = 'validar' | 'rechazar';

interface Props {
  pago: Pago;
  accion: AccionPago;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
  alConfirmar: (datos: { nota?: string; motivo?: string }) => void;
  enCurso: boolean;
}

type Formulario = {
  confirmado?: boolean;
  nota?: string;
  motivo?: string;
};

/**
 * Los esquemas de `@oasis/shared` exigen `confirmado: true` (literal). El tipo
 * del formulario usa `boolean` porque RHF no modela literales en sus valores por
 * defecto; el resolver se ajusta para que ambos tipos coincidan.
 */
type ResolverAjustado = NonNullable<Parameters<typeof useForm<Formulario>>[0]>['resolver'];

/**
 * Confirmación de las dos acciones irreversibles sobre un pago.
 *
 * Validar un pago emite un recibo y dispara una transacción real en Polygon;
 * rechazarlo cierra la puerta al cobro. Ninguna debe quedar en un
 * `<Button onClick>` sin confirmar. El formulario se valida con los esquemas de
 * `@oasis/shared` (los mismos que exige el API): `confirmado` debe ser
 * literalmente `true` y el rechazo exige además un motivo, que queda en la
 * auditoría del pago.
 */
export function ConfirmarPagoDialog({
  pago,
  accion,
  abierto,
  alCambiarAbierto,
  alConfirmar,
  enCurso,
}: Props) {
  const baseId = useId();
  const esValidar = accion === 'validar';

  const formulario = useForm<Formulario>({
    resolver: zodResolver(esValidar ? validarPagoSchema : rechazarPagoSchema) as ResolverAjustado,
    mode: 'onSubmit',
    defaultValues: { confirmado: false, nota: '', motivo: '' },
  });

  useEffect(() => {
    if (abierto) {
      formulario.reset({ confirmado: false, nota: '', motivo: '' });
    }
    // Solo al abrir/cerrar: evita que cada tecla reinicie el formulario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const { register, handleSubmit, formState } = formulario;
  const errorConfirmado = formState.errors.confirmado?.message as string | undefined;
  const errorNota = formState.errors.nota?.message as string | undefined;
  const errorMotivo = formState.errors.motivo?.message as string | undefined;

  const idConfirmado = `${baseId}-confirmado`;
  const idNota = `${baseId}-nota`;
  const idMotivo = `${baseId}-motivo`;

  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esValidar ? 'Validar pago' : 'Rechazar pago'}</DialogTitle>
          <DialogDescription>
            {esValidar
              ? 'Se emitirá el recibo y el worker iniciará el anclaje en Polygon. La acción no se puede deshacer.'
              : 'El pago quedará como RECHAZADO y ya no podrá validarse. Indique el motivo.'}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg border p-3 text-sm">
          <dt className="text-[var(--muted-foreground)]">Póliza</dt>
          <dd className="font-mono text-xs">{pago.numeroPoliza ?? '—'}</dd>
          <dt className="text-[var(--muted-foreground)]">Monto</dt>
          <dd className="tabular-nums">{formatearMoneda(pago.monto)}</dd>
          <dt className="text-[var(--muted-foreground)]">Referencia</dt>
          <dd>{pago.referencia ?? '—'}</dd>
        </dl>

        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((valores) => {
            alConfirmar(
              esValidar
                ? { nota: valores.nota?.trim() || undefined }
                : { motivo: valores.motivo?.trim() ?? '' },
            );
          })}
        >
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <input
                {...register('confirmado', {
                  setValueAs: (valor) => valor === true,
                })}
                id={idConfirmado}
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                aria-invalid={errorConfirmado ? true : undefined}
                aria-describedby={errorConfirmado ? `${idConfirmado}-error` : undefined}
              />
              <Label htmlFor={idConfirmado}>
                Confirmo que revisé la póliza y los datos del pago
              </Label>
            </div>
            {errorConfirmado ? (
              <p
                id={`${idConfirmado}-error`}
                role="alert"
                className="text-sm text-[var(--destructive)]"
              >
                {errorConfirmado}
              </p>
            ) : null}
          </div>

          {esValidar ? (
            <div className="grid gap-1.5">
              <Label htmlFor={idNota}>Nota de auditoría (opcional)</Label>
              <Input
                {...register('nota')}
                id={idNota}
                placeholder="Ej.: depósito confirmado en el banco"
                aria-invalid={errorNota ? true : undefined}
                aria-describedby={errorNota ? `${idNota}-error` : undefined}
              />
              {errorNota ? (
                <p
                  id={`${idNota}-error`}
                  role="alert"
                  className="text-sm text-[var(--destructive)]"
                >
                  {errorNota}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor={idMotivo}>
                Motivo del rechazo <span aria-hidden="true">*</span>
              </Label>
              <Input
                {...register('motivo')}
                id={idMotivo}
                placeholder="Ej.: el depósito no se encontró en la cuenta"
                aria-invalid={errorMotivo ? true : undefined}
                aria-describedby={errorMotivo ? `${idMotivo}-error` : undefined}
              />
              {errorMotivo ? (
                <p
                  id={`${idMotivo}-error`}
                  role="alert"
                  className="text-sm text-[var(--destructive)]"
                >
                  {errorMotivo}
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => alCambiarAbierto(false)}
              disabled={enCurso}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={esValidar ? 'default' : 'destructive'}
              disabled={enCurso}
              aria-busy={enCurso}
              data-testid={`confirmar-${accion}`}
            >
              {enCurso
                ? esValidar
                  ? 'Validando…'
                  : 'Rechazando…'
                : esValidar
                  ? 'Validar y emitir recibo'
                  : 'Rechazar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
