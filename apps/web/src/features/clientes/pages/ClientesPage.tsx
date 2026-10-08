import type { Cliente, FiltroEstadoCliente } from '@oasis/shared';
import { FILTROS_ESTADO_CLIENTE } from '@oasis/shared';
import { MoreHorizontal, Search } from 'lucide-react';
import { useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatearFecha } from '@/lib/format';
import { useDebounce } from '@/lib/use-debounce';

import { FormularioCliente } from '../components/FormularioCliente';
import { nombreCliente } from '../nombre-cliente';
import { useClientes, useDesactivarCliente, useReactivarCliente } from '../hooks';

const ETIQUETAS_ESTADO: Record<FiltroEstadoCliente, string> = {
  ACTIVOS: 'Activos',
  INACTIVOS: 'Inactivos',
  TODOS: 'Todos',
};

type AccionConfirmada = 'desactivar' | 'reactivar';

const CONFIRMACIONES: Record<
  AccionConfirmada,
  { titulo: string; descripcion: string; boton: string }
> = {
  desactivar: {
    titulo: 'Desactivar cliente',
    descripcion:
      'No se elimina nada: su historial de pólizas y pagos se conserva. Dejará de aparecer al registrar nuevas pólizas.',
    boton: 'Desactivar',
  },
  reactivar: {
    titulo: 'Reactivar cliente',
    descripcion: 'Volverá a estar disponible al registrar nuevas pólizas.',
    boton: 'Reactivar',
  },
};

export function ClientesPage() {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<FiltroEstadoCliente>('ACTIVOS');
  const [pagina, setPagina] = useState(1);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Cliente | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    cliente: Cliente;
    accion: AccionConfirmada;
  } | null>(null);

  const qDiferida = useDebounce(q);
  const consulta = useClientes({ q: qDiferida || undefined, estado, page: pagina });
  const desactivar = useDesactivarCliente();
  const reactivar = useReactivarCliente();

  const clientes = consulta.data?.data ?? [];
  const meta = consulta.data?.meta;
  const confirmacionActual = confirmacion ? CONFIRMACIONES[confirmacion.accion] : null;

  function abrirFormulario(cliente: Cliente | null) {
    setEnEdicion(cliente);
    setFormularioAbierto(true);
  }

  function confirmar() {
    if (!confirmacion) {
      return;
    }
    const { cliente, accion } = confirmacion;
    if (accion === 'desactivar') {
      desactivar.mutate(cliente.id);
    } else {
      reactivar.mutate(cliente.id);
    }
    setConfirmacion(null);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Cartera de asegurados registrados en el bróker.
          </p>
        </div>
        <Button data-testid="boton-nuevo-cliente" onClick={() => abrirFormulario(null)}>
          Nuevo cliente
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Buscar clientes"
            placeholder="Buscar por nombre o identificación"
            className="pl-9"
            value={q}
            onChange={(evento) => {
              setQ(evento.target.value);
              setPagina(1);
            }}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filtro-estado-clientes">Estado</Label>
          <Select
            value={estado}
            onValueChange={(valor) => {
              setEstado(valor as FiltroEstadoCliente);
              setPagina(1);
            }}
          >
            <SelectTrigger id="filtro-estado-clientes" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTROS_ESTADO_CLIENTE.map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {ETIQUETAS_ESTADO[valor]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TablaDatos
        titulo={meta ? `${meta.total} clientes` : 'Clientes'}
        cargando={consulta.isLoading}
        error={consulta.error}
        alReintentar={() => void consulta.refetch()}
        vacio={q ? 'No hay clientes que coincidan con la búsqueda' : 'Sin clientes registrados'}
        hayDatos={clientes.length > 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificación</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registrado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-mono text-xs">{cliente.identificacion}</TableCell>
                <TableCell>{nombreCliente(cliente)}</TableCell>
                <TableCell>{cliente.email}</TableCell>
                <TableCell>{cliente.telefono ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={cliente.activo ? 'success' : 'secondary'}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>{formatearFecha(cliente.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Acciones de ${nombreCliente(cliente)}`}
                        data-testid={`menu-cliente-${cliente.id}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => abrirFormulario(cliente)}>
                        Editar
                      </DropdownMenuItem>
                      {cliente.activo ? (
                        <DropdownMenuItem
                          onSelect={() => setConfirmacion({ cliente, accion: 'desactivar' })}
                        >
                          Desactivar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onSelect={() => setConfirmacion({ cliente, accion: 'reactivar' })}
                        >
                          Reactivar
                        </DropdownMenuItem>
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
            setEnEdicion(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{enEdicion ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
            <DialogDescription>
              {enEdicion
                ? 'Actualice los datos de contacto; la identificación solo se modifica si el cliente no tiene pólizas.'
                : 'Los datos personales nunca se escriben en la blockchain.'}
            </DialogDescription>
          </DialogHeader>
          <FormularioCliente
            key={enEdicion?.id ?? 'nuevo'}
            cliente={enEdicion ?? undefined}
            alGuardar={() => {
              setFormularioAbierto(false);
              setEnEdicion(null);
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
              {confirmacion ? ` Cliente: ${nombreCliente(confirmacion.cliente)}.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmar}
              disabled={desactivar.isPending || reactivar.isPending}
              data-testid="confirmar-accion-cliente"
            >
              {confirmacionActual?.boton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
