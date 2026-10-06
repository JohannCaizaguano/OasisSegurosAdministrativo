import type { Usuario } from '@oasis/shared';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Paginacion, TablaDatos } from '@/components/TablaDatos';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { formatearFecha } from '@/lib/format';

import { DialogoContrasenaTemporal } from '../components/DialogoContrasenaTemporal';
import { FormularioUsuario } from '../components/FormularioUsuario';
import {
  useDesactivarUsuario,
  useReactivarUsuario,
  useRestablecerContrasena,
  useUsuarios,
} from '../hooks';

type AccionConfirmada = 'desactivar' | 'reactivar' | 'restablecer';

const CONFIRMACIONES: Record<
  AccionConfirmada,
  { titulo: string; descripcion: string; boton: string }
> = {
  desactivar: {
    titulo: 'Desactivar usuario',
    descripcion: 'Se cerrarán todas sus sesiones y no podrá iniciar sesión hasta reactivarlo.',
    boton: 'Desactivar',
  },
  reactivar: {
    titulo: 'Reactivar usuario',
    descripcion: 'Volverá a poder iniciar sesión.',
    boton: 'Reactivar',
  },
  restablecer: {
    titulo: 'Restablecer contraseña',
    descripcion:
      'Se generará una contraseña temporal nueva y se cerrarán todas sus sesiones. La verá una sola vez.',
    boton: 'Restablecer',
  },
};

export function UsuariosPage() {
  const [pagina, setPagina] = useState(1);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<Usuario | null>(null);
  const [contrasenaTemporal, setContrasenaTemporal] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    usuario: Usuario;
    accion: AccionConfirmada;
  } | null>(null);

  const consulta = useUsuarios(pagina);
  const actor = useAuthStore((estado) => estado.usuario);
  const desactivar = useDesactivarUsuario();
  const reactivar = useReactivarUsuario();
  const restablecer = useRestablecerContrasena();

  const usuarios = consulta.data?.data ?? [];
  const meta = consulta.data?.meta;
  const esPropia = (usuario: Usuario) => usuario.id === actor?.id;

  function mostrarError(error: unknown) {
    toast.error(error instanceof ApiError ? error.message : 'No fue posible completar la acción');
  }

  function confirmar() {
    if (!confirmacion) {
      return;
    }
    const { usuario, accion } = confirmacion;
    if (accion === 'desactivar') {
      desactivar.mutate(usuario.id, { onError: mostrarError });
      setConfirmacion(null);
    } else if (accion === 'reactivar') {
      reactivar.mutate(usuario.id, { onError: mostrarError });
      setConfirmacion(null);
    } else {
      restablecer.mutate(usuario.id, {
        onSuccess: ({ contrasenaTemporal: nueva }) => {
          setConfirmacion(null);
          setContrasenaTemporal(nueva);
        },
        onError: mostrarError,
      });
    }
  }

  function abrirFormulario(usuario: Usuario | null) {
    setUsuarioEnEdicion(usuario);
    setFormularioAbierto(true);
  }

  const confirmacionActual = confirmacion ? CONFIRMACIONES[confirmacion.accion] : null;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Cuentas del personal del bróker: administradores y operadores.
          </p>
        </div>
        <Button data-testid="boton-nuevo-usuario" onClick={() => abrirFormulario(null)}>
          Nuevo usuario
        </Button>
      </div>

      <TablaDatos
        titulo={meta ? `${meta.total} usuarios` : 'Usuarios'}
        cargando={consulta.isLoading}
        error={consulta.error}
        alReintentar={() => void consulta.refetch()}
        vacio="Sin usuarios del personal"
        hayDatos={usuarios.length > 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nombre}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {usuario.rol === 'ADMIN' ? 'Administrador' : 'Operador'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={usuario.activo ? 'success' : 'secondary'}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>{formatearFecha(usuario.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Acciones de ${usuario.nombre}`}
                        data-testid={`menu-usuario-${usuario.id}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => abrirFormulario(usuario)}>
                        Editar
                      </DropdownMenuItem>
                      {!esPropia(usuario) && (
                        <>
                          {usuario.activo ? (
                            <DropdownMenuItem
                              onSelect={() => setConfirmacion({ usuario, accion: 'desactivar' })}
                            >
                              Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() => setConfirmacion({ usuario, accion: 'reactivar' })}
                            >
                              Reactivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onSelect={() => setConfirmacion({ usuario, accion: 'restablecer' })}
                          >
                            Restablecer contraseña
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TablaDatos>

      {meta && meta.totalPages > 1 && (
        <Paginacion
          pagina={pagina}
          totalPaginas={meta.totalPages}
          cargando={consulta.isFetching}
          alCambiar={setPagina}
        />
      )}

      <Dialog
        open={formularioAbierto}
        onOpenChange={(abierto) => {
          setFormularioAbierto(abierto);
          if (!abierto) {
            setUsuarioEnEdicion(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{usuarioEnEdicion ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
            <DialogDescription>
              {usuarioEnEdicion
                ? 'El correo no se edita: identifica la cuenta y la bitácora.'
                : 'Se generará una contraseña temporal que se muestra una sola vez.'}
            </DialogDescription>
          </DialogHeader>
          <FormularioUsuario
            key={usuarioEnEdicion?.id ?? 'nuevo'}
            usuario={usuarioEnEdicion ?? undefined}
            actorId={actor?.id}
            alGuardar={(creado) => {
              setFormularioAbierto(false);
              setUsuarioEnEdicion(null);
              if (creado) {
                setContrasenaTemporal(creado.contrasenaTemporal);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmacion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setConfirmacion(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmacionActual?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmacionActual?.descripcion}
              {confirmacion ? ` Usuario: ${confirmacion.usuario.nombre}.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmar}
              disabled={restablecer.isPending}
              data-testid="confirmar-accion"
            >
              {restablecer.isPending ? 'Restableciendo…' : confirmacionActual?.boton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogoContrasenaTemporal
        contrasena={contrasenaTemporal}
        alCerrar={() => setContrasenaTemporal(null)}
      />
    </div>
  );
}
