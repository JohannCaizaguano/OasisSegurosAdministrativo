import type { EstadoPago, Pago } from '@oasis/shared';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';

import { AvisoError, EsqueletoTabla } from '@/components/DataState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatearFecha, formatearMoneda } from '@/lib/format';

import { ConfirmarPagoDialog, type AccionPago } from '../components/ConfirmarPagoDialog';
import { usePagos, useRechazarPago, useValidarPago } from '../hooks';

const ESTADOS: Array<{ valor: EstadoPago | 'TODOS'; texto: string }> = [
  { valor: 'TODOS', texto: 'Todos los estados' },
  { valor: 'REGISTRADO', texto: 'Registrados' },
  { valor: 'VALIDADO', texto: 'Validados' },
  { valor: 'RECHAZADO', texto: 'Rechazados' },
];

function varianteEstado(estado: EstadoPago) {
  if (estado === 'VALIDADO') return 'success' as const;
  if (estado === 'RECHAZADO') return 'destructive' as const;
  return 'warning' as const;
}

export function PagosPage() {
  const idFiltro = useId();
  const [estado, setEstado] = useState<EstadoPago | 'TODOS'>('TODOS');
  const [pagina, setPagina] = useState(1);
  const [pendiente, setPendiente] = useState<{ pago: Pago; accion: AccionPago } | null>(null);

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

  function cerrarDialogo() {
    if (!enCurso) {
      setPendiente(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pagos</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Valide un pago para emitir su recibo y anclarlo en Polygon.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={idFiltro}>Filtrar por estado</Label>
          <Select
            value={estado}
            onValueChange={(valor) => {
              setEstado(valor as EstadoPago | 'TODOS');
              setPagina(1);
            }}
          >
            <SelectTrigger id={idFiltro} className="w-52" data-testid="filtro-estado-pagos">
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

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">{meta ? `${meta.total} pagos` : 'Pagos'}</CardTitle>
        </CardHeader>
        <CardContent>
          {consulta.isLoading ? (
            <EsqueletoTabla />
          ) : consulta.isError ? (
            <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
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
                {consulta.data && consulta.data.data.length === 0 && (
                  <TableEmpty mensaje="No hay pagos con este filtro" />
                )}
                {consulta.data?.data.map((pago) => (
                  <TableRow key={pago.id} data-testid={`fila-pago-${pago.id}`}>
                    <TableCell>{formatearFecha(pago.fechaPago)}</TableCell>
                    <TableCell className="font-mono text-xs">{pago.numeroPoliza ?? '—'}</TableCell>
                    <TableCell>{pago.referencia ?? '—'}</TableCell>
                    <TableCell>{pago.metodo}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatearMoneda(pago.monto)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={varianteEstado(pago.estado)}>{pago.estado}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {pago.estado === 'REGISTRADO' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            data-testid={`boton-validar-${pago.id}`}
                            disabled={enCurso}
                            onClick={() => setPendiente({ pago, accion: 'validar' })}
                          >
                            Validar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            data-testid={`boton-rechazar-${pago.id}`}
                            disabled={enCurso}
                            onClick={() => setPendiente({ pago, accion: 'rechazar' })}
                          >
                            Rechazar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {pago.validadoEn ? formatearFecha(pago.validadoEn) : '—'}
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

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted-foreground)]">
        <span data-testid="contador-registrados">{registrados} validables en esta página</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagina <= 1 || consulta.isFetching}
            onClick={() => setPagina((valor) => valor - 1)}
          >
            Anterior
          </Button>
          <span className="py-1.5">
            Página {meta?.page ?? 1} de {meta?.totalPages ?? 1}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            // Sin `meta` no se sabe si hay página siguiente.
            disabled={!meta || meta.page >= meta.totalPages || consulta.isFetching}
            onClick={() => setPagina((valor) => valor + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        ¿Necesita ver un recibo?{' '}
        <Link className="underline" to="/recibos">
          Ir a Recibos
        </Link>
      </p>

      {pendiente ? (
        <ConfirmarPagoDialog
          pago={pendiente.pago}
          accion={pendiente.accion}
          abierto
          enCurso={enCurso}
          alCambiarAbierto={(abierto) => {
            if (!abierto) {
              cerrarDialogo();
            }
          }}
          alConfirmar={(datos) => {
            const { pago, accion } = pendiente;
            if (accion === 'validar') {
              validar.mutate(
                { id: pago.id, entrada: { confirmado: true, nota: datos.nota } },
                { onSettled: () => setPendiente(null) },
              );
            } else {
              rechazar.mutate(
                { id: pago.id, entrada: { confirmado: true, motivo: datos.motivo ?? '' } },
                { onSettled: () => setPendiente(null) },
              );
            }
          }}
        />
      ) : null}
    </div>
  );
}
