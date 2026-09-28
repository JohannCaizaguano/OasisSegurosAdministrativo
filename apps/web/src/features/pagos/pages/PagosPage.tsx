import type { EstadoPago } from '@oasis/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [estado, setEstado] = useState<EstadoPago | 'TODOS'>('TODOS');
  const [pagina, setPagina] = useState(1);
  const validar = useValidarPago();
  const rechazar = useRechazarPago();

  const consulta = usePagos({
    page: pagina,
    pageSize: 20,
    estado: estado === 'TODOS' ? undefined : estado,
  });

  const registrados = consulta.data?.data.filter((pago) => pago.estado === 'REGISTRADO') ?? [];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pagos</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Valide un pago para emitir su recibo y anclarlo en Polygon.
          </p>
        </div>
        <Select
          value={estado}
          onValueChange={(valor) => {
            setEstado(valor as EstadoPago | 'TODOS');
            setPagina(1);
          }}
        >
          <SelectTrigger className="w-52" data-testid="filtro-estado-pagos">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {consulta.data ? `${consulta.data.meta.total} pagos` : 'Pagos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consulta.isLoading ? (
            <div className="grid gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
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
                {consulta.data?.data.length === 0 && (
                  <TableEmpty mensaje="No hay pagos con este filtro" />
                )}
                {consulta.data?.data.map((pago) => (
                  <TableRow key={pago.id} data-testid={`fila-pago-${pago.id}`}>
                    <TableCell>{formatearFecha(pago.fechaPago)}</TableCell>
                    <TableCell className="font-mono text-xs">{pago.numeroPoliza ?? '—'}</TableCell>
                    <TableCell>{pago.referencia ?? '—'}</TableCell>
                    <TableCell>{pago.metodo}</TableCell>
                    <TableCell className="text-right">{formatearMoneda(pago.monto)}</TableCell>
                    <TableCell>
                      <Badge variant={varianteEstado(pago.estado)}>{pago.estado}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {pago.estado === 'REGISTRADO' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            data-testid={`boton-validar-${pago.id}`}
                            disabled={validar.isPending}
                            onClick={() => validar.mutate(pago.id)}
                          >
                            Validar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`boton-rechazar-${pago.id}`}
                            disabled={rechazar.isPending}
                            onClick={() => rechazar.mutate(pago.id)}
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

      <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
        <span data-testid="contador-registrados">
          {registrados.length} validables en esta página
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina <= 1}
            onClick={() => setPagina((valor) => valor - 1)}
          >
            Anterior
          </Button>
          <span className="py-1.5">
            Página {consulta.data?.meta.page ?? 1} de {consulta.data?.meta.totalPages ?? 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!!consulta.data && pagina >= consulta.data.meta.totalPages}
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
    </div>
  );
}
