import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { useId } from 'react';
import type { Pago } from '@oasis/shared';
import { validarPagoSchema } from '@oasis/shared';

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

import { ResumenPago } from './ResumenPago';

interface Props {
  pago: Pago;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
  alConfirmar: (datos: { nota?: string }) => void;
  enCurso: boolean;
}

type Formulario = { confirmado?: boolean; nota?: string };

/**
 * HU-18 (D10): la segunda de las tres acciones es marcar la casilla tras revisar el resumen;
 * la tercera, «Validar y emitir recibo». El montaje por pago reinicia el formulario.
 */
export function ValidarPagoDialog({
  pago,
  abierto,
  alCambiarAbierto,
  alConfirmar,
  enCurso,
}: Props) {
  const baseId = useId();
  // RHF tipa la casilla como `boolean` y el esquema exige el literal `true`.
  const { register, handleSubmit, formState } = useForm<Formulario>({
    resolver: zodResolver(validarPagoSchema) as Resolver<Formulario>,
    defaultValues: { confirmado: false, nota: '' },
  });
  const errorConfirmado = formState.errors.confirmado?.message;
  const errorNota = formState.errors.nota?.message;
  const idConfirmado = `${baseId}-confirmado`;
  const idNota = `${baseId}-nota`;

  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Validar pago</DialogTitle>
          <DialogDescription>
            Se emitirá el recibo y se registrará para que cualquiera pueda verificarlo. El cliente
            lo verá en su portal. La acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <ResumenPago pago={pago} />

        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((valores) =>
            alConfirmar({ nota: valores.nota?.trim() || undefined }),
          )}
        >
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <input
                {...register('confirmado', { setValueAs: (valor) => valor === true })}
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

          <div className="grid gap-1.5">
            <Label htmlFor={idNota}>Nota de auditoría (opcional)</Label>
            <Input
              {...register('nota')}
              id={idNota}
              placeholder="Ej.: débito confirmado por la aseguradora"
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
              variant="primary"
              disabled={enCurso}
              aria-busy={enCurso}
              data-testid="confirmar-validar"
            >
              {enCurso ? 'Validando…' : 'Validar y emitir recibo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
