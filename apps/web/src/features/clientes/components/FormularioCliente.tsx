import type { CrearClienteInput, TipoIdentificacion } from '@oasis/shared';
import { crearClienteSchema } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/api-client';

import { useCrearCliente } from '../hooks';

const AYUDAS: Record<TipoIdentificacion, string> = {
  CEDULA: '10 dígitos',
  RUC: '13 dígitos terminados en 001',
  PASAPORTE: '5 a 20 letras o números',
};

export function FormularioCliente({ alGuardar }: { alGuardar: () => void }) {
  const formulario = useForm<CrearClienteInput>({
    resolver: zodResolver(crearClienteSchema) as Resolver<CrearClienteInput>,
    defaultValues: { tipoIdentificacion: 'CEDULA', identificacion: '', email: '' },
    // Evita que los campos de la rama anterior viajen en el cuerpo al cambiar
    // de tipo de identificación.
    shouldUnregister: true,
  });

  const crear = useCrearCliente();

  // El Select no es un input nativo: `useController` lo registra para que el valor viaje al enviar.
  const { field: campoTipo } = useController({
    control: formulario.control,
    name: 'tipoIdentificacion',
  });
  const tipo = campoTipo.value;
  const errores = formulario.formState.errors;

  function manejarError(error: unknown) {
    const detalle =
      error instanceof ApiError ? (error.details as { campo?: string } | undefined) : undefined;
    if (detalle?.campo === 'identificacion') {
      formulario.setError('identificacion', {
        message: error instanceof Error ? error.message : 'Identificación duplicada',
      });
      return;
    }
    toast.error(error instanceof ApiError ? error.message : 'No fue posible crear el cliente');
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={formulario.handleSubmit((datos) =>
        crear.mutate(datos, { onSuccess: alGuardar, onError: manejarError }),
      )}
    >
      <div className="grid gap-2">
        <Label htmlFor="tipo-identificacion">Tipo de identificación</Label>
        <Select
          value={campoTipo.value}
          onValueChange={(valor) => {
            campoTipo.onChange(valor);
            // El mensaje de identificación depende del tipo: se revalida al cambiarlo.
            void formulario.trigger('identificacion');
          }}
        >
          <SelectTrigger
            id="tipo-identificacion"
            aria-invalid={errores.tipoIdentificacion ? true : undefined}
            aria-describedby={errores.tipoIdentificacion ? 'tipo-identificacion-error' : undefined}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CEDULA">Cédula</SelectItem>
            <SelectItem value="RUC">RUC</SelectItem>
            <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
          </SelectContent>
        </Select>
        {errores.tipoIdentificacion && (
          <p
            id="tipo-identificacion-error"
            role="alert"
            className="text-sm text-[var(--destructive)]"
          >
            {errores.tipoIdentificacion.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="identificacion">Identificación</Label>
        <Input
          id="identificacion"
          placeholder={AYUDAS[tipo]}
          aria-invalid={errores.identificacion ? true : undefined}
          aria-describedby={
            errores.identificacion
              ? 'identificacion-error identificacion-ayuda'
              : 'identificacion-ayuda'
          }
          {...formulario.register('identificacion')}
        />
        <p id="identificacion-ayuda" className="text-xs text-[var(--muted-foreground)]">
          {AYUDAS[tipo]}
        </p>
        {errores.identificacion && (
          <p id="identificacion-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.identificacion.message}
          </p>
        )}
      </div>
      {tipo === 'RUC' ? (
        <div className="grid gap-2">
          <Label htmlFor="razonSocial">Razón social</Label>
          <Input
            id="razonSocial"
            aria-invalid={errores.razonSocial ? true : undefined}
            aria-describedby={errores.razonSocial ? 'razonSocial-error' : undefined}
            {...formulario.register('razonSocial')}
          />
          {errores.razonSocial && (
            <p id="razonSocial-error" role="alert" className="text-sm text-[var(--destructive)]">
              {errores.razonSocial.message}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input
              id="nombres"
              aria-invalid={errores.nombres ? true : undefined}
              aria-describedby={errores.nombres ? 'nombres-error' : undefined}
              {...formulario.register('nombres')}
            />
            {errores.nombres && (
              <p id="nombres-error" role="alert" className="text-sm text-[var(--destructive)]">
                {errores.nombres.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              id="apellidos"
              aria-invalid={errores.apellidos ? true : undefined}
              aria-describedby={errores.apellidos ? 'apellidos-error' : undefined}
              {...formulario.register('apellidos')}
            />
            {errores.apellidos && (
              <p id="apellidos-error" role="alert" className="text-sm text-[var(--destructive)]">
                {errores.apellidos.message}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          aria-invalid={errores.email ? true : undefined}
          aria-describedby={errores.email ? 'email-error' : undefined}
          {...formulario.register('email')}
        />
        {errores.email && (
          <p id="email-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.email.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          aria-invalid={errores.telefono ? true : undefined}
          aria-describedby={errores.telefono ? 'telefono-error' : undefined}
          {...formulario.register('telefono')}
        />
        {errores.telefono && (
          <p id="telefono-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.telefono.message}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={crear.isPending} data-testid="boton-guardar-cliente">
          {crear.isPending ? 'Guardando…' : 'Guardar cliente'}
        </Button>
      </DialogFooter>
    </form>
  );
}
