import { cambiarContrasenaSchema } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { CampoContrasena } from '@/components/CampoContrasena';
import { Encabezado } from '@/components/layout/Encabezado';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';

import { useCambiarContrasena } from '../hooks';

const formularioSchema = cambiarContrasenaSchema
  .safeExtend({
    confirmacion: z.string().min(1, 'Confirme la nueva contraseña'),
  })
  .refine((datos) => datos.confirmacion === datos.nueva, {
    path: ['confirmacion'],
    message: 'La confirmación no coincide con la nueva contraseña',
  });

type FormularioInput = z.infer<typeof formularioSchema>;

interface IssueValidacion {
  path?: unknown;
  message?: unknown;
}

/** Mensaje del API para el campo `actual`, si la validación señala ese campo. */
function mensajeDeActual(detalles: unknown): string | null {
  if (!Array.isArray(detalles)) {
    return null;
  }
  for (const issue of detalles as IssueValidacion[]) {
    if (
      Array.isArray(issue.path) &&
      issue.path[0] === 'actual' &&
      typeof issue.message === 'string'
    ) {
      return issue.message;
    }
  }
  return null;
}

export function CambiarContrasenaPage() {
  const cambiar = useCambiarContrasena();
  const navegar = useNavigate();
  const formulario = useForm<FormularioInput>({
    resolver: zodResolver(formularioSchema),
    defaultValues: { actual: '', nueva: '', confirmacion: '' },
  });

  const enviar = formulario.handleSubmit((datos) => {
    cambiar.mutate(
      { actual: datos.actual, nueva: datos.nueva },
      {
        onSuccess: () => {
          toast.success('Contraseña actualizada. Se cerraron sus otras sesiones.');
          navegar('/', { replace: true });
        },
        onError: (error) => {
          const mensaje = error instanceof ApiError ? mensajeDeActual(error.details) : null;
          if (mensaje) {
            formulario.setError('actual', { message: mensaje }, { shouldFocus: true });
          } else {
            toast.error(
              error instanceof ApiError ? error.message : 'No fue posible cambiar la contraseña',
            );
          }
        },
      },
    );
  });

  const errores = formulario.formState.errors;

  return (
    <div className="mx-auto grid w-full max-w-[480px] gap-5">
      <Encabezado
        titulo="Cambiar contraseña"
        descripcion="Al cambiarla se cerrarán sus otras sesiones; esta continuará abierta."
      />

      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
          <CardDescription>Mínimo 8 caracteres y distinta de la actual.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={enviar} data-testid="formulario-contrasena">
            <div className="grid gap-1.5">
              <Label htmlFor="actual">Contraseña actual</Label>
              <CampoContrasena
                id="actual"
                autoComplete="current-password"
                aria-invalid={errores.actual ? true : undefined}
                aria-describedby={errores.actual ? 'actual-error' : undefined}
                {...formulario.register('actual')}
              />
              {errores.actual && (
                <p
                  id="actual-error"
                  role="alert"
                  className="text-caption font-medium text-destructive"
                >
                  {errores.actual.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nueva">Nueva contraseña</Label>
              <CampoContrasena
                id="nueva"
                autoComplete="new-password"
                aria-invalid={errores.nueva ? true : undefined}
                aria-describedby={errores.nueva ? 'nueva-error' : undefined}
                {...formulario.register('nueva')}
              />
              {errores.nueva && (
                <p
                  id="nueva-error"
                  role="alert"
                  className="text-caption font-medium text-destructive"
                >
                  {errores.nueva.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmacion">Confirmar nueva contraseña</Label>
              <CampoContrasena
                id="confirmacion"
                autoComplete="new-password"
                aria-invalid={errores.confirmacion ? true : undefined}
                aria-describedby={errores.confirmacion ? 'confirmacion-error' : undefined}
                {...formulario.register('confirmacion')}
              />
              {errores.confirmacion && (
                <p
                  id="confirmacion-error"
                  role="alert"
                  className="text-caption font-medium text-destructive"
                >
                  {errores.confirmacion.message}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="submit"
                disabled={cambiar.isPending}
                data-testid="boton-cambiar-contrasena"
              >
                {cambiar.isPending ? 'Guardando…' : 'Cambiar contraseña'}
              </Button>
              <Button asChild variant="quiet">
                <Link to="/">Volver</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
