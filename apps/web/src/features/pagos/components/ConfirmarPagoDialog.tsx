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

/** RHF usa `boolean` donde el esquema exige el literal `true`; el resolver se ajusta. */
type ResolverAjustado = NonNullable<Parameters<typeof useForm<Formulario>>[0]>['resolver'];

/**
 * Confirmación de las dos acciones irreversibles sobre un pago, validada con
 * los esquemas del API.
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

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-md bg-secondary p-3.5">
          <dt className="text-muted-foreground">Póliza</dt>
          <dd className="cifra text-right font-semibold">{pago.numeroPoliza ?? '—'}</dd>
          <dt className="text-muted-foreground">Monto</dt>
          <dd className="cifra text-right font-semibold">{formatearMoneda(pago.monto)}</dd>
          <dt className="text-muted-foreground">Referencia</dt>
          <dd className="text-right font-semibold">{pago.referencia ?? '—'}</dd>
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
                className="size-5 shrink-0 accent-foreground"
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
                className="text-caption font-medium text-destructive"
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
                  className="text-caption font-medium text-destructive"
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
                  className="text-caption font-medium text-destructive"
                >
                  {errorMotivo}
                </p>
              ) : null}
            </div>
          )}

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
              variant={esValidar ? 'primary' : 'danger'}
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
