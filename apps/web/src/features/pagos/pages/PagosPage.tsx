import type { EstadoPago, Pago } from '@oasis/shared';
import { ESTADOS_PAGO, ETIQUETAS_METODO_PAGO } from '@oasis/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AvisoError, AvisoVacio, EsqueletoTabla } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { LeyendaEstados } from '@/components/LeyendaEstados';
import { Encabezado } from '@/components/layout/Encabezado';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Campo } from '@/components/Campo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectorCliente } from '@/features/clientes/components/SelectorCliente';
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
import { formatearFecha, formatearMoneda } from '@/lib/format';
import { useFiltrosEnUrl } from '@/lib/use-filtros-url';

import { DetallePagoSheet } from '../components/DetallePagoSheet';
import { FormularioPago } from '../components/FormularioPago';
import { SelectorPoliza } from '../components/SelectorPoliza';
import { RechazarPagoDialog } from '../components/RechazarPagoDialog';
import { ValidarPagoDialog } from '../components/ValidarPagoDialog';
import { usePagos, useRechazarPago, useValidarPago } from '../hooks';

type AccionPago = 'validar' | 'rechazar';

const ESTADOS: Array<{ valor: EstadoPago | 'TODOS'; texto: string }> = [
  { valor: 'TODOS', texto: 'Todos los estados' },
  { valor: 'REGISTRADO', texto: 'Registrados' },
  { valor: 'VALIDADO', texto: 'Validados' },
  { valor: 'RECHAZADO', texto: 'Rechazados' },
];

type ClaveFiltro = 'estado' | 'desde' | 'hasta' | 'polizaId' | 'clienteId';

const ERROR_RANGO = 'La fecha «hasta» no puede ser anterior a «desde»';

export function PagosPage() {
  const filtros = useFiltrosEnUrl<ClaveFiltro>();
  const parametro = filtros.leer('estado');
  const estado: EstadoPago | 'TODOS' = ESTADOS_PAGO.find((e) => e === parametro) ?? 'TODOS';
  const desde = filtros.leer('desde');
  const hasta = filtros.leer('hasta');
  const rangoInvalido = !!desde && !!hasta && desde > hasta;
  const [pagina, setPagina] = useState(1);
  // Los combobox son no controlados: se remontan para vaciarlos al limpiar los filtros.
  const [generacion, setGeneracion] = useState(0);
  const [pendiente, setPendiente] = useState<{ pago: Pago; accion: AccionPago } | null>(null);
  const [detalleDe, setDetalleDe] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);

  const validar = useValidarPago();
  const rechazar = useRechazarPago();

  const consulta = usePagos({
    page: pagina,
    pageSize: 20,
    estado: estado === 'TODOS' ? undefined : estado,
    desde,
    hasta: rangoInvalido ? undefined : hasta,
    polizaId: filtros.leer('polizaId'),
    clienteId: filtros.leer('clienteId'),
  });

  const enCurso = validar.isPending || rechazar.isPending;
  const registrados = consulta.data?.data.filter((p) => p.estado === 'REGISTRADO').length ?? 0;
  const meta = consulta.data?.meta;

  function filtrar(cambios: Partial<Record<ClaveFiltro, string | undefined>>) {
    filtros.cambiar(cambios);
    setPagina(1);
  }

  function cambiarEstado(valor: EstadoPago | 'TODOS') {
    filtrar({ estado: valor === 'TODOS' ? undefined : valor });
  }

  function limpiarFiltros() {
    filtros.limpiar();
    setPagina(1);
    setGeneracion((valor) => valor + 1);
  }

  function cerrarDialogo() {
    if (!enCurso) {
      setPendiente(null);
    }
  }

  return (
    <div className="grid gap-5">
      <Encabezado
        titulo="Pagos"
        descripcion="Registre los pagos notificados y valídelos para emitir su recibo."
      >
        <Button data-testid="boton-nuevo-pago" onClick={() => setRegistrando(true)}>
          <Plus aria-hidden="true" />
          Registrar pago
        </Button>
      </Encabezado>

      <div className="flex flex-wrap items-start gap-3">
        <div className="grid w-full gap-2 sm:w-52">
          <Label htmlFor="filtro-estado-pagos">Filtrar por estado</Label>
          <Select
            value={estado}
            onValueChange={(valor) => cambiarEstado(valor as EstadoPago | 'TODOS')}
          >
            <SelectTrigger id="filtro-estado-pagos" data-testid="filtro-estado-pagos">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((opcion) => (
                <SelectItem key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-44">
          <Campo id="filtro-desde-pagos" label="Desde">
            {(atributos) => (
              <Input
                {...atributos}
                type="date"
                value={desde ?? ''}
                onChange={(evento) => filtrar({ desde: evento.target.value })}
              />
            )}
          </Campo>
        </div>
        <div className="w-full sm:w-44">
          <Campo
            id="filtro-hasta-pagos"
            label="Hasta"
            error={rangoInvalido ? ERROR_RANGO : undefined}
          >
            {(atributos) => (
              <Input
                {...atributos}
                type="date"
                value={hasta ?? ''}
                min={desde}
                onChange={(evento) => filtrar({ hasta: evento.target.value })}
              />
            )}
          </Campo>
        </div>
        <div className="grid w-full gap-2 sm:w-60">
          <Label htmlFor="filtro-poliza-pagos">Póliza</Label>
          <SelectorPoliza
            key={`poliza-${generacion}`}
            id="filtro-poliza-pagos"
            onChange={(id) => filtrar({ polizaId: id })}
          />
        </div>
        <div className="grid w-full gap-2 sm:w-64">
          <Label htmlFor="filtro-cliente-pagos">Cliente</Label>
          <SelectorCliente
            key={`cliente-${generacion}`}
            id="filtro-cliente-pagos"
            onChange={(id) => filtrar({ clienteId: id })}
          />
        </div>
        {filtros.hayFiltros ? (
          <Button
            type="button"
            variant="quiet"
            className="self-end sm:mt-[30px] sm:self-start"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </Button>
        ) : null}
      </div>

      <LeyendaEstados dominio="pago" />

      <Card className="min-w-0">
        <CardHeader className="pb-3">
          <CardTitle>{meta ? `${meta.total} pagos` : 'Pagos'}</CardTitle>
        </CardHeader>
        <CardContent>
          {consulta.isLoading ? (
            <EsqueletoTabla />
          ) : consulta.isError ? (
            <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
          ) : consulta.data?.data.length === 0 ? (
            !filtros.hayFiltros ? (
              <AvisoVacio descripcion="Use «Registrar pago» para registrar el primero.">
                Sin pagos registrados
              </AvisoVacio>
            ) : (
              <AvisoVacio
                descripcion="Pruebe con otros filtros o quítelos."
                accion={
                  <Button type="button" variant="secondary" size="sm" onClick={limpiarFiltros}>
                    Quitar filtro
                  </Button>
                }
              >
                No hay pagos con este filtro
              </AvisoVacio>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Póliza</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.data.map((pago, indice) => (
                  <TableRow
                    key={pago.id}
                    data-testid={`fila-pago-${pago.id}`}
                    style={{ animationDelay: `${indice * 35}ms` }}
                    className="animate-fila"
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatearFecha(pago.fechaPago)}
                    </TableCell>
                    <TableCell className="cifra font-semibold whitespace-nowrap">
                      {pago.numeroPoliza ?? '—'}
                    </TableCell>
                    <TableCell>{pago.referencia ?? '—'}</TableCell>
                    <TableCell>{ETIQUETAS_METODO_PAGO[pago.metodo]}</TableCell>
                    <TableCell className="cifra text-right font-semibold whitespace-nowrap">
                      {formatearMoneda(pago.monto)}
                    </TableCell>
                    <TableCell>
                      <EstadoInsignia dominio="pago" estado={pago.estado} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="quiet"
                          aria-label={`Ver detalle del pago ${pago.referencia ?? formatearFecha(pago.fechaPago)}`}
                          onClick={() => setDetalleDe(pago.id)}
                        >
                          Detalle
                        </Button>
                        {pago.estado === 'REGISTRADO' ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="quiet"
                              data-testid={`boton-validar-${pago.id}`}
                              disabled={enCurso}
                              onClick={() => setPendiente({ pago, accion: 'validar' })}
                            >
                              Validar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger-outline"
                              data-testid={`boton-rechazar-${pago.id}`}
                              disabled={enCurso}
                              onClick={() => setPendiente({ pago, accion: 'rechazar' })}
                            >
                              Rechazar
                            </Button>
                          </>
                        ) : (
                          <span className="text-caption whitespace-nowrap text-muted-foreground">
                            {formatearFecha(pago.validadoEn ?? pago.rechazadoEn)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <nav
        aria-label="Paginación"
        className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground"
      >
        <span data-testid="contador-registrados">{registrados} validables en esta página</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pagina <= 1 || consulta.isFetching}
            onClick={() => setPagina((valor) => valor - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {meta?.page ?? 1} de {meta?.totalPages ?? 1}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            // Sin `meta` no se sabe si hay página siguiente.
            disabled={!meta || meta.page >= meta.totalPages || consulta.isFetching}
            onClick={() => setPagina((valor) => valor + 1)}
          >
            Siguiente
          </Button>
        </div>
      </nav>

      <p className="text-muted-foreground">
        ¿Necesita ver un recibo?{' '}
        <Link className="font-semibold text-link underline" to="/recibos">
          Ir a Recibos
        </Link>
      </p>

      <Dialog open={registrando} onOpenChange={setRegistrando}>
        <DialogContent
          onEscapeKeyDown={(evento) => {
            // Escape cierra primero la lista abierta del combobox de pólizas, no el diálogo.
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
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              El pago queda por validar. La póliza debe estar vigente y el monto no puede superar su
              saldo pendiente.
            </DialogDescription>
          </DialogHeader>
          {registrando && <FormularioPago alGuardar={() => setRegistrando(false)} />}
        </DialogContent>
      </Dialog>

      <DetallePagoSheet pagoId={detalleDe} alCerrar={() => setDetalleDe(null)} />

      {pendiente?.accion === 'validar' && (
        <ValidarPagoDialog
          key={pendiente.pago.id}
          pago={pendiente.pago}
          abierto
          enCurso={enCurso}
          alCambiarAbierto={(abierto) => !abierto && cerrarDialogo()}
          alConfirmar={({ nota }) =>
            validar.mutate(
              { id: pendiente.pago.id, entrada: { confirmado: true, nota } },
              { onSettled: () => setPendiente(null) },
            )
          }
        />
      )}
      {pendiente?.accion === 'rechazar' && (
        <RechazarPagoDialog
          key={pendiente.pago.id}
          pago={pendiente.pago}
          abierto
          enCurso={enCurso}
          alCambiarAbierto={(abierto) => !abierto && cerrarDialogo()}
          alConfirmar={({ motivo }) =>
            rechazar.mutate(
              { id: pendiente.pago.id, entrada: { confirmado: true, motivo } },
              { onSettled: () => setPendiente(null) },
            )
          }
        />
      )}
    </div>
  );
}
