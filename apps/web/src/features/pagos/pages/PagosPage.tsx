import type { EstadoPago, Pago } from '@oasis/shared';
import { ESTADOS_PAGO, ETIQUETAS_METODO_PAGO } from '@oasis/shared';
import { Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

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
import { formatearFecha, formatearMoneda } from '@/lib/format';

import { FormularioPago } from '../components/FormularioPago';
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

export function PagosPage() {
  const idFiltro = useId();
  const [parametros, setParametros] = useSearchParams();
  const parametro = parametros.get('estado');
  const estado: EstadoPago | 'TODOS' = ESTADOS_PAGO.find((e) => e === parametro) ?? 'TODOS';
  const [pagina, setPagina] = useState(1);
  const [pendiente, setPendiente] = useState<{ pago: Pago; accion: AccionPago } | null>(null);
  const [registrando, setRegistrando] = useState(false);

  const validar = useValidarPago();
  const rechazar = useRechazarPago();

  const consulta = usePagos({
    page: pagina,
    pageSize: 20,
    estado: estado === 'TODOS' ? undefined : estado,
  });

  const enCurso = validar.isPending || rechazar.isPending;
  const registrados = consulta.data?.data.filter((p) => p.estado === 'REGISTRADO').length ?? 0;
  const meta = consulta.data?.meta;

  function cambiarEstado(valor: EstadoPago | 'TODOS') {
    setParametros(valor === 'TODOS' ? {} : { estado: valor }, { replace: true });
    setPagina(1);
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

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid w-full gap-1.5 sm:w-56">
          <Label htmlFor={idFiltro}>Filtrar por estado</Label>
          <Select
            value={estado}
            onValueChange={(valor) => cambiarEstado(valor as EstadoPago | 'TODOS')}
          >
            <SelectTrigger id={idFiltro} data-testid="filtro-estado-pagos">
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
            estado === 'TODOS' ? (
              <AvisoVacio descripcion="Use «Registrar pago» para registrar el primero.">
                Sin pagos registrados
              </AvisoVacio>
            ) : (
              <AvisoVacio
                descripcion="Pruebe con «Todos los estados»."
                accion={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => cambiarEstado('TODOS')}
                  >
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
                      {pago.estado === 'REGISTRADO' ? (
                        <div className="flex justify-end gap-2">
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
                        </div>
                      ) : (
                        <span className="text-caption whitespace-nowrap text-muted-foreground">
                          {formatearFecha(pago.validadoEn ?? pago.rechazadoEn)}
                        </span>
                      )}
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
