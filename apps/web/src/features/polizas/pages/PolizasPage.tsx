import type { EstadoPoliza, OrdenPoliza, Poliza } from '@oasis/shared';
import { ESTADOS_POLIZA } from '@oasis/shared';
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Plus } from 'lucide-react';
import { useState } from 'react';

import { EstadoInsignia } from '@/components/EstadoInsignia';
import { presentacionDe } from '@/components/estados';
import { Encabezado } from '@/components/layout/Encabezado';
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
import { SelectorCliente } from '@/features/clientes/components/SelectorCliente';
import { formatearFecha, formatearMoneda } from '@/lib/format';

import { FormularioPoliza } from '../components/FormularioPoliza';
import { PlanCuotasDialog } from '../components/PlanCuotasDialog';
import { useCambiarEstadoPoliza, useCatalogoAseguradoras, usePolizas } from '../hooks';

const TODAS = 'TODAS';

const CONFIRMACIONES: Record<
  'VENCIDA' | 'CANCELADA',
  { titulo: string; descripcion: string; boton: string }
> = {
  VENCIDA: {
    titulo: 'Marcar póliza como vencida',
    descripcion: 'Esta acción es definitiva: la póliza quedará vencida y no admitirá nuevos pagos.',
    boton: 'Marcar vencida',
  },
  CANCELADA: {
    titulo: 'Cancelar póliza',
    descripcion:
      'Esta acción es definitiva: la póliza quedará cancelada y no admitirá nuevos pagos.',
    boton: 'Cancelar póliza',
  },
};

const ICONOS_ORDEN = { ascending: ArrowUp, descending: ArrowDown, none: ArrowUpDown } as const;

export function PolizasPage() {
  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [generacionCliente, setGeneracionCliente] = useState(0);
  const [aseguradoraId, setAseguradoraId] = useState(TODAS);
  const [estado, setEstado] = useState(TODAS);
  const [orden, setOrden] = useState<OrdenPoliza>('recientes');
  const [pagina, setPagina] = useState(1);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Poliza | null>(null);
  const [planDe, setPlanDe] = useState<Poliza | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    poliza: Poliza;
    estado: 'VENCIDA' | 'CANCELADA';
  } | null>(null);

  const consulta = usePolizas({
    clienteId,
    aseguradoraId: aseguradoraId === TODAS ? undefined : aseguradoraId,
    estado: estado === TODAS ? undefined : (estado as EstadoPoliza),
    orden,
    page: pagina,
  });
  const aseguradoras = useCatalogoAseguradoras();
  const cambiarEstado = useCambiarEstadoPoliza();

  const polizas = consulta.data?.data ?? [];
  const meta = consulta.data?.meta;
  const confirmacionActual = confirmacion ? CONFIRMACIONES[confirmacion.estado] : null;
  const ariaSort =
    orden === 'fechaFinAsc' ? 'ascending' : orden === 'fechaFinDesc' ? 'descending' : 'none';
  const IconoOrden = ICONOS_ORDEN[ariaSort];

  function abrirFormulario(poliza: Poliza | null) {
    setEnEdicion(poliza);
    setFormularioAbierto(true);
  }

  function alternarOrden() {
    setOrden((actual) => (actual === 'fechaFinAsc' ? 'fechaFinDesc' : 'fechaFinAsc'));
    setPagina(1);
  }

  function limpiarFiltros() {
    setClienteId(undefined);
    setAseguradoraId(TODAS);
    setEstado(TODAS);
    setOrden('recientes');
    setPagina(1);
    // El combobox es no controlado: remontarlo vacía el texto y la selección.
    setGeneracionCliente((valor) => valor + 1);
  }

  function confirmarEstado() {
    if (!confirmacion) {
      return;
    }
    cambiarEstado.mutate({
      id: confirmacion.poliza.id,
      datos: { estado: confirmacion.estado },
    });
    setConfirmacion(null);
  }

  return (
    <div className="grid gap-5">
      <Encabezado
        titulo="Pólizas"
        descripcion="Pólizas colocadas por el bróker y su estado de vigencia."
      >
        <Button data-testid="boton-nueva-poliza" onClick={() => abrirFormulario(null)}>
          <Plus aria-hidden="true" />
          Nueva póliza
        </Button>
      </Encabezado>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid w-full gap-1.5 sm:w-64">
          <Label htmlFor="filtro-cliente-polizas">Cliente</Label>
          <SelectorCliente
            key={`filtro-cliente-${generacionCliente}`}
            id="filtro-cliente-polizas"
            onChange={(id) => {
              setClienteId(id);
              setPagina(1);
            }}
          />
        </div>

        <div className="grid w-full gap-1.5 sm:w-56">
          <Label htmlFor="filtro-aseguradora-polizas">Aseguradora</Label>
          <Select
            value={aseguradoraId}
            onValueChange={(valor) => {
              setAseguradoraId(valor);
              setPagina(1);
            }}
          >
            <SelectTrigger id="filtro-aseguradora-polizas">
              <SelectValue placeholder="Aseguradora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas las aseguradoras</SelectItem>
              {(aseguradoras.data?.data ?? []).map((aseguradora) => (
                <SelectItem key={aseguradora.id} value={aseguradora.id}>
                  {aseguradora.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid w-full gap-1.5 sm:w-44">
          <Label htmlFor="filtro-estado-polizas">Estado</Label>
          <Select
            value={estado}
            onValueChange={(valor) => {
              setEstado(valor);
              setPagina(1);
            }}
          >
            <SelectTrigger id="filtro-estado-polizas">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todos los estados</SelectItem>
              {ESTADOS_POLIZA.map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {presentacionDe('poliza', valor).texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="button" variant="quiet" className="min-h-input" onClick={limpiarFiltros}>
          Limpiar filtros
        </Button>
      </div>

      <TablaDatos
        titulo={meta ? `${meta.total} pólizas` : 'Pólizas'}
        cargando={consulta.isLoading}
        error={consulta.error}
        alReintentar={() => void consulta.refetch()}
        vacio="Sin pólizas que coincidan con los filtros"
        hayDatos={polizas.length > 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Aseguradora</TableHead>
              <TableHead>Ramo</TableHead>
              <TableHead className="text-right">Prima</TableHead>
              <TableHead aria-sort={ariaSort}>
                <button
                  type="button"
                  onClick={alternarOrden}
                  className="-mx-1.5 inline-flex min-h-control items-center gap-1.5 rounded-sm px-1.5 tracking-[inherit] uppercase hover:text-foreground"
                  data-testid="orden-vigencia"
                >
                  Vigencia
                  <IconoOrden className="size-3.5" aria-hidden="true" />
                </button>
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {polizas.map((poliza) => (
              <TableRow key={poliza.id}>
                <TableCell className="cifra font-semibold whitespace-nowrap">
                  {poliza.numero}
                </TableCell>
                <TableCell>{poliza.clienteNombre ?? '—'}</TableCell>
                <TableCell>{poliza.aseguradoraNombre ?? '—'}</TableCell>
                <TableCell>{poliza.ramo}</TableCell>
                <TableCell className="cifra text-right font-semibold whitespace-nowrap">
                  {formatearMoneda(poliza.primaTotal)}
                </TableCell>
                <TableCell>
                  <span className="whitespace-nowrap">{formatearFecha(poliza.fechaInicio)} –</span>{' '}
                  <span className="whitespace-nowrap">{formatearFecha(poliza.fechaFin)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <EstadoInsignia dominio="poliza" estado={poliza.estado} />
                    {poliza.enMora && <EstadoInsignia dominio="poliza" estado="EN_MORA" />}
                  </div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label={`Plan de cuotas de ${poliza.numero}`}
                    data-testid={`boton-cuotas-${poliza.id}`}
                    onClick={() => setPlanDe(poliza)}
                  >
                    Cuotas
                  </Button>
                  {poliza.estado === 'VIGENTE' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="quiet"
                          size="icon"
                          aria-label={`Acciones de ${poliza.numero}`}
                          data-testid={`menu-poliza-${poliza.id}`}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => abrirFormulario(poliza)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setConfirmacion({ poliza, estado: 'VENCIDA' })}
                        >
                          Marcar vencida
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setConfirmacion({ poliza, estado: 'CANCELADA' })}
                        >
                          Cancelar póliza
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
        <DialogContent
          onEscapeKeyDown={(evento) => {
            // D16: si el foco está en un combobox con su lista abierta, Escape lo cierra
            // a él. Radix escucha en `document` en captura antes que React y respeta
            // `defaultPrevented`, así que aquí se impide que además cierre el diálogo.
            const objetivo = evento.target;
            if (
              objetivo instanceof HTMLElement &&
              objetivo.matches('[role="combobox"][aria-expanded="true"]')
            ) {
              evento.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{enEdicion ? 'Editar póliza' : 'Nueva póliza'}</DialogTitle>
            <DialogDescription>
              {enEdicion
                ? `Póliza ${enEdicion.numero} de ${enEdicion.clienteNombre ?? 'un cliente'}. El cliente no se puede cambiar.`
                : 'La póliza se registra como vigente; la prima debe ser mayor que cero.'}
            </DialogDescription>
          </DialogHeader>
          <FormularioPoliza
            key={enEdicion?.id ?? 'nueva'}
            poliza={enEdicion ?? undefined}
            alGuardar={() => {
              setFormularioAbierto(false);
              setEnEdicion(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {planDe && (
        <PlanCuotasDialog
          key={planDe.id}
          poliza={planDe}
          abierto
          alCambiarAbierto={(abierto) => !abierto && setPlanDe(null)}
        />
      )}

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
              {confirmacion ? ` Póliza: ${confirmacion.poliza.numero}.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={confirmarEstado}
              disabled={cambiarEstado.isPending}
              data-testid="confirmar-accion-poliza"
            >
              {confirmacionActual?.boton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
