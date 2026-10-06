import type { Aseguradora } from '@oasis/shared';
import { actualizarAseguradoraSchema, crearAseguradoraSchema } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';

import { useCrearAseguradora, useEditarAseguradora } from '../hooks';

interface DatosFormulario {
  nombre: string;
  ruc: string;
}

interface FormularioAseguradoraProps {
  aseguradora?: Aseguradora;
  alGuardar: () => void;
}

export function FormularioAseguradora({ aseguradora, alGuardar }: FormularioAseguradoraProps) {
  const esEdicion = aseguradora !== undefined;
  const resolver = esEdicion
    ? zodResolver(actualizarAseguradoraSchema)
    : zodResolver(crearAseguradoraSchema);
  const formulario = useForm<DatosFormulario>({
    resolver: resolver as Resolver<DatosFormulario>,
    defaultValues: esEdicion
      ? { nombre: aseguradora.nombre, ruc: aseguradora.ruc }
      : { nombre: '', ruc: '' },
  });

  const crear = useCrearAseguradora();
  const editar = useEditarAseguradora();
  const errores = formulario.formState.errors;
  const enviando = crear.isPending || editar.isPending;

  function manejarError(error: unknown) {
    const detalle =
      error instanceof ApiError ? (error.details as { campo?: string } | undefined) : undefined;
    if (detalle?.campo === 'ruc') {
      formulario.setError('ruc', {
        message: error instanceof Error ? error.message : 'RUC duplicado',
      });
      return;
    }
    toast.error(
      error instanceof ApiError ? error.message : 'No fue posible guardar la aseguradora',
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={formulario.handleSubmit((datos) => {
        if (esEdicion && aseguradora) {
          editar.mutate(
            { id: aseguradora.id, datos },
            { onSuccess: alGuardar, onError: manejarError },
          );
          return;
        }
        crear.mutate(datos, { onSuccess: alGuardar, onError: manejarError });
      })}
    >
      <div className="grid gap-2">
        <Label htmlFor="aseguradora-nombre">Nombre</Label>
        <Input
          id="aseguradora-nombre"
          aria-invalid={errores.nombre ? true : undefined}
          aria-describedby={errores.nombre ? 'aseguradora-nombre-error' : undefined}
          {...formulario.register('nombre')}
        />
        {errores.nombre && (
          <p
            id="aseguradora-nombre-error"
            role="alert"
            className="text-sm text-[var(--destructive)]"
          >
            {errores.nombre.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="aseguradora-ruc">RUC</Label>
        <Input
          id="aseguradora-ruc"
          inputMode="numeric"
          aria-invalid={errores.ruc ? true : undefined}
          aria-describedby={errores.ruc ? 'aseguradora-ruc-error' : undefined}
          {...formulario.register('ruc')}
        />
        {errores.ruc && (
          <p id="aseguradora-ruc-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.ruc.message}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={enviando} data-testid="boton-guardar-aseguradora">
          {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear aseguradora'}
        </Button>
      </DialogFooter>
    </form>
  );
}
