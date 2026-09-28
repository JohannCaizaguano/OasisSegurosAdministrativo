import type { CrearClienteInput } from '@oasis/shared';
import { crearClienteSchema } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

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

import { useCrearCliente } from '../hooks';

export function FormularioCliente({ alGuardar }: { alGuardar: () => void }) {
  const formulario = useForm<CrearClienteInput>({
    resolver: zodResolver(crearClienteSchema),
    defaultValues: { tipoIdentificacion: 'CEDULA', identificacion: '', email: '' },
    // Sin esto, los campos de la rama anterior (razonSocial <-> nombres) se
    // quedan en el estado del formulario y viajan en el cuerpo al cambiar de
    // tipo de identificación.
    shouldUnregister: true,
  });

  const crear = useCrearCliente();

  // `watch` en el cuerpo del componente re-renderiza el formulario entero en
  // cada pulsación y ESLint marca uso de una API no memorizable; `useWatch`
  // suscribe solo a ese campo.
  const tipo = useWatch({ control: formulario.control, name: 'tipoIdentificacion' });

  return (
    <form
      className="grid gap-4"
      onSubmit={formulario.handleSubmit((datos) => crear.mutate(datos, { onSuccess: alGuardar }))}
    >
      <div className="grid gap-2">
        <Label htmlFor="tipo-identificacion">Tipo de identificación</Label>
        <Select
          value={tipo}
          onValueChange={(valor) =>
            formulario.setValue(
              'tipoIdentificacion',
              valor as CrearClienteInput['tipoIdentificacion'],
              // Revalida para que el error de RUC (que depende del tipo)
              // desaparezca al cambiar a Cédula, sin esperar al submit.
              { shouldValidate: true, shouldDirty: true },
            )
          }
        >
          <SelectTrigger id="tipo-identificacion">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CEDULA">Cédula</SelectItem>
            <SelectItem value="RUC">RUC</SelectItem>
            <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="identificacion">Identificación</Label>
        <Input
          id="identificacion"
          aria-invalid={formulario.formState.errors.identificacion ? true : undefined}
          aria-describedby={
            formulario.formState.errors.identificacion ? 'identificacion-error' : undefined
          }
          {...formulario.register('identificacion')}
        />
        {formulario.formState.errors.identificacion && (
          <p id="identificacion-error" role="alert" className="text-sm text-[var(--destructive)]">
            {formulario.formState.errors.identificacion.message}
          </p>
        )}
      </div>
      {tipo === 'RUC' ? (
        <div className="grid gap-2">
          <Label htmlFor="razonSocial">Razón social</Label>
          <Input id="razonSocial" {...formulario.register('razonSocial')} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input id="nombres" {...formulario.register('nombres')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input id="apellidos" {...formulario.register('apellidos')} />
          </div>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          aria-invalid={formulario.formState.errors.email ? true : undefined}
          aria-describedby={formulario.formState.errors.email ? 'email-error' : undefined}
          {...formulario.register('email')}
        />
        {formulario.formState.errors.email && (
          <p id="email-error" role="alert" className="text-sm text-[var(--destructive)]">
            {formulario.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...formulario.register('telefono')} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={crear.isPending} data-testid="boton-guardar-cliente">
          {crear.isPending ? 'Guardando…' : 'Guardar cliente'}
        </Button>
      </DialogFooter>
    </form>
  );
}
