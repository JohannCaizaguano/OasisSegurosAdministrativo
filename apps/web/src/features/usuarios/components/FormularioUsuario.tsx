import type { ActualizarUsuarioInput, RolPersonal, Usuario, UsuarioCreado } from '@oasis/shared';
import { actualizarUsuarioSchema, crearUsuarioSchema } from '@oasis/shared';
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

import { useCrearUsuario, useEditarUsuario } from '../hooks';

interface DatosFormulario {
  email?: string;
  nombre: string;
  rol: RolPersonal;
}

interface FormularioUsuarioProps {
  usuario?: Usuario;
  actorId?: string;
  alGuardar: (creado?: UsuarioCreado) => void;
}

export function FormularioUsuario({ usuario, actorId, alGuardar }: FormularioUsuarioProps) {
  const esEdicion = usuario !== undefined;
  const esPropio = usuario?.id === actorId;
  const resolver = esEdicion
    ? zodResolver(actualizarUsuarioSchema)
    : zodResolver(crearUsuarioSchema);
  const formulario = useForm<DatosFormulario>({
    resolver: resolver as Resolver<DatosFormulario>,
    defaultValues: esEdicion
      ? { nombre: usuario.nombre, rol: usuario.rol as RolPersonal }
      : { email: '', nombre: '', rol: 'OPERADOR' },
  });

  const crear = useCrearUsuario();
  const editar = useEditarUsuario();
  // El Select no es un input nativo: `useController` lo registra para que el valor viaje al enviar.
  const { field: campoRol } = useController({ control: formulario.control, name: 'rol' });
  const errores = formulario.formState.errors;
  const enviando = crear.isPending || editar.isPending;

  function manejarError(error: unknown) {
    const detalle =
      error instanceof ApiError ? (error.details as { campo?: string } | undefined) : undefined;
    if (detalle?.campo === 'email') {
      formulario.setError('email', {
        message: error instanceof Error ? error.message : 'Correo duplicado',
      });
      return;
    }
    toast.error(error instanceof ApiError ? error.message : 'No fue posible guardar el usuario');
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={formulario.handleSubmit((datos) => {
        if (esEdicion && usuario) {
          const cambios: ActualizarUsuarioInput = { nombre: datos.nombre };
          // Enviar el rol solo si cambió evita cerrar sesiones al editar solo el nombre.
          if (datos.rol !== usuario.rol) {
            cambios.rol = datos.rol;
          }
          editar.mutate(
            { id: usuario.id, datos: cambios },
            { onSuccess: () => alGuardar(), onError: manejarError },
          );
          return;
        }
        crear.mutate(
          { email: datos.email ?? '', nombre: datos.nombre, rol: datos.rol },
          { onSuccess: (creado) => alGuardar(creado), onError: manejarError },
        );
      })}
    >
      {!esEdicion && (
        <div className="grid gap-2">
          <Label htmlFor="usuario-email">Correo electrónico</Label>
          <Input
            id="usuario-email"
            type="email"
            autoComplete="off"
            aria-invalid={errores.email ? true : undefined}
            aria-describedby={errores.email ? 'usuario-email-error' : undefined}
            {...formulario.register('email')}
          />
          {errores.email && (
            <p id="usuario-email-error" role="alert" className="text-sm text-[var(--destructive)]">
              {errores.email.message}
            </p>
          )}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="usuario-nombre">Nombre</Label>
        <Input
          id="usuario-nombre"
          aria-invalid={errores.nombre ? true : undefined}
          aria-describedby={errores.nombre ? 'usuario-nombre-error' : undefined}
          {...formulario.register('nombre')}
        />
        {errores.nombre && (
          <p id="usuario-nombre-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.nombre.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="usuario-rol">Rol</Label>
        <Select
          value={campoRol.value}
          disabled={esPropio}
          onValueChange={(valor) => campoRol.onChange(valor)}
        >
          <SelectTrigger
            id="usuario-rol"
            aria-invalid={errores.rol ? true : undefined}
            aria-describedby={
              [esPropio && 'usuario-rol-ayuda', errores.rol && 'usuario-rol-error']
                .filter(Boolean)
                .join(' ') || undefined
            }
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="OPERADOR">Operador</SelectItem>
          </SelectContent>
        </Select>
        {esPropio && (
          <p id="usuario-rol-ayuda" className="text-sm text-[var(--muted-foreground)]">
            No puede cambiar su propio rol.
          </p>
        )}
        {errores.rol && (
          <p id="usuario-rol-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.rol.message}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={enviando} data-testid="boton-guardar-usuario">
          {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </DialogFooter>
    </form>
  );
}
