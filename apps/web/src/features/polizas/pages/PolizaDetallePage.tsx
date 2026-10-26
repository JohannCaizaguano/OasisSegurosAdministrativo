import type { Cuota, Poliza } from '@oasis/shared';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';

import { AvisoError, AvisoVacio, EsqueletoTabla } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { LeyendaEstados } from '@/components/LeyendaEstados';
import { Encabezado } from '@/components/layout/Encabezado';
import { Migas } from '@/components/layout/Migas';
import { RamoEtiqueta } from '@/components/RamoEtiqueta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePagos } from '@/features/pagos/hooks';
import { formatearFecha, formatearMoneda, formatearSoloFecha } from '@/lib/format';

import { useCuotas, usePoliza } from '../hooks';

const POLIZAS = { a: '/polizas', texto: 'Pólizas' };

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-caption text-muted-foreground">{termino}</dt>
      <dd className="font-semibold break-words">{children}</dd>
    </div>
  );
}

/** HU-51: el texto se muestra tal como se capturó, con sus saltos de línea. */
function TextoLargo({
  titulo,
  texto,
  vacio,
  testId,
}: {
  titulo: string;
  texto: string | null;
  vacio: string;
  testId: string;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {texto ? (
          <p data-testid={testId} className="max-w-[75ch] break-words whitespace-pre-line">
            {texto}
          </p>
        ) : (
          <p className="text-muted-foreground">{vacio}</p>
        )}
      </CardContent>
    </Card>
  );
}

function CuotaDelPlan({ cuota }: { cuota: Cuota }) {
  const titulo = `Cuota ${cuota.numero}`;
  return (
    <li aria-label={titulo} className="grid gap-2 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <span className="grid gap-0.5">
          <span className="font-semibold">{titulo}</span>
          <span className="text-caption text-muted-foreground">
            Vence <span className="cifra">{formatearFecha(cuota.fechaVencimiento)}</span>
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-right">
            <span className="cifra block font-semibold">{formatearMoneda(cuota.valor)}</span>
            <span className="cifra block text-caption text-muted-foreground">
              Pagado {formatearMoneda(cuota.valorPagado)}
            </span>
          </span>
          <EstadoInsignia dominio="cuota" estado={cuota.estado} />
        </span>
      </div>
      {cuota.aplicaciones.length > 0 ? (
        <ul
          aria-label={`Pagos aplicados a la cuota ${cuota.numero}`}
          className="grid gap-1 border-t border-border pt-2 text-label"
        >
          {cuota.aplicaciones.map((aplicacion) => (
            <li
              key={`${aplicacion.pagoId}-${aplicacion.fecha}`}
              className="flex justify-between gap-3 text-muted-foreground"
            >
              <span>
                Pago aplicado el{' '}
                <span className="cifra">{formatearSoloFecha(aplicacion.fecha)}</span>
              </span>
              <span className="cifra font-semibold text-foreground">
                {formatearMoneda(aplicacion.monto)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function PlanDeCuotas({ polizaId }: { polizaId: string }) {
  const cuotas = useCuotas(polizaId);
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Plan de cuotas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {cuotas.isLoading ? (
          <EsqueletoTabla />
        ) : cuotas.isError ? (
          <AvisoError error={cuotas.error} alReintentar={() => void cuotas.refetch()} />
        ) : (
          <ol aria-label="Plan de cuotas" className="grid divide-y divide-border">
            {(cuotas.data ?? []).map((cuota) => (
              <CuotaDelPlan key={cuota.id} cuota={cuota} />
            ))}
          </ol>
        )}
        <LeyendaEstados dominio="cuota" />
      </CardContent>
    </Card>
  );
}

function PagosDeLaPoliza({ polizaId }: { polizaId: string }) {
  // ponytail: solo la primera página de 50 en el orden de D15 (por validar primero, luego por
  // fecha); si una póliza supera los 50 pagos, se pagina como en Pagos.
  const pagos = usePagos({ page: 1, pageSize: 50, polizaId });
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Pagos de la póliza</CardTitle>
      </CardHeader>
      <CardContent>
        {pagos.isLoading ? (
          <EsqueletoTabla />
        ) : pagos.isError ? (
          <AvisoError error={pagos.error} alReintentar={() => void pagos.refetch()} />
        ) : pagos.data?.data.length === 0 ? (
          <AvisoVacio descripcion="Los pagos registrados de esta póliza aparecerán aquí.">
            Sin pagos todavía
          </AvisoVacio>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.data?.data.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell className="cifra whitespace-nowrap">
                    {formatearFecha(pago.fechaPago)}
                  </TableCell>
                  <TableCell>{pago.referencia ?? '—'}</TableCell>
                  <TableCell className="cifra text-right font-semibold whitespace-nowrap">
                    {formatearMoneda(pago.monto)}
                  </TableCell>
                  <TableCell>
                    <EstadoInsignia dominio="pago" estado={pago.estado} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function Datos({ poliza }: { poliza: Poliza }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Datos y vigencia</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
          <Dato termino="Cliente">{poliza.clienteNombre ?? '—'}</Dato>
          <Dato termino="Aseguradora">{poliza.aseguradoraNombre ?? '—'}</Dato>
          <Dato termino="Ramo">
            <RamoEtiqueta codigo={poliza.ramoCodigo} nombre={poliza.ramo} />
          </Dato>
          <Dato termino="Prima total">
            <span className="cifra">{formatearMoneda(poliza.primaTotal)}</span>
          </Dato>
          <Dato termino="Vigencia">
            <span className="cifra">
              {formatearFecha(poliza.fechaInicio)} – {formatearFecha(poliza.fechaFin)}
            </span>
          </Dato>
        </dl>
      </CardContent>
    </Card>
  );
}

/** `/polizas/:id` (D17): datos, vigencia, cobertura, condiciones, cuotas con sus aplicaciones y pagos. */
export function PolizaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const consulta = usePoliza(id);
  const poliza = consulta.data;

  if (consulta.isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!poliza) {
    return (
      <div className="grid gap-4">
        <Migas anterior={POLIZAS} actual="Póliza" />
        <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Migas anterior={POLIZAS} actual={poliza.numero} />
        <Encabezado titulo={`Póliza ${poliza.numero}`}>
          <EstadoInsignia dominio="poliza" estado={poliza.estado} />
          {poliza.enMora ? <EstadoInsignia dominio="poliza" estado="EN_MORA" /> : null}
        </Encabezado>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Datos poliza={poliza} />
        <PlanDeCuotas polizaId={poliza.id} />
        <TextoLargo
          titulo="Cobertura"
          texto={poliza.cobertura}
          vacio="Sin cobertura registrada."
          testId="cobertura"
        />
        <TextoLargo
          titulo="Condiciones"
          texto={poliza.condiciones}
          vacio="Sin condiciones registradas."
          testId="condiciones"
        />
      </div>

      <PagosDeLaPoliza polizaId={poliza.id} />
    </div>
  );
}
