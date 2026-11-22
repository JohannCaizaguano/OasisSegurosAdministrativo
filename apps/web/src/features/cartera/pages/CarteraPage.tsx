import {
  aCentavos,
  aMonto,
  VISTAS_CARTERA,
  type FilaCartera,
  type VistaCartera,
} from '@oasis/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Campo } from '@/components/Campo';
import { AvisoError, AvisoVacio, EsqueletoTabla } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { CLASES_TONO } from '@/components/estados';
import { LeyendaEstados } from '@/components/LeyendaEstados';
import { Encabezado } from '@/components/layout/Encabezado';
import { RamoEtiqueta } from '@/components/RamoEtiqueta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SelectorCliente } from '@/features/clientes/components/SelectorCliente';
import { useCatalogoAseguradoras } from '@/features/polizas/hooks';
import { formatearFecha, formatearMoneda } from '@/lib/format';
import { useFiltrosEnUrl } from '@/lib/use-filtros-url';
import { cn } from '@/lib/utils';

import { useCartera } from '../hooks';

type ClaveFiltro = 'vista' | 'clienteId' | 'aseguradoraId' | 'desde' | 'hasta';

const TODAS = 'TODAS';
const FILTROS = ['clienteId', 'aseguradoraId', 'desde', 'hasta'] as const;
const ERROR_RANGO = 'La fecha «hasta» no puede ser anterior a «desde»';

const VISTAS: Record<VistaCartera, { texto: string; vacio: string }> = {
  POR_VENCER: { texto: 'Por vencer', vacio: 'No hay cuotas que venzan en los próximos 7 días' },
  VENCIDAS: { texto: 'Vencidas', vacio: 'No hay cuotas vencidas' },
  TODAS: { texto: 'Todas', vacio: 'No hay cuotas por vencer ni vencidas' },
};

/** Días de atraso: aviso de 1 a 30 y error con más de 30 (DESIGN.md, tonos de estado). */
function DiasAtraso({ dias }: { dias: number }) {
  if (dias === 0) {
    return (
      <span data-testid="dias-atraso" className="text-muted-foreground">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Sin atraso</span>
      </span>
    );
  }
  const tono = dias > 30 ? 'error' : 'aviso';
  return (
    <span
      data-testid="dias-atraso"
      data-tono={tono}
      className={cn(
        'cifra inline-flex rounded-full px-2.5 py-0.5 font-semibold whitespace-nowrap',
        CLASES_TONO[tono],
      )}
    >
      {dias === 1 ? '1 día' : `${dias} días`}
    </span>
  );
}

/** D11: una parcial vencida sigue VENCIDA; el abono se dice junto a la insignia. */
function EstadoCuota({ fila }: { fila: FilaCartera }) {
  const abonado = aCentavos(fila.valor) - aCentavos(fila.pendiente);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <EstadoInsignia dominio="cuota" estado={fila.estado} />
      {fila.estado === 'VENCIDA' && abonado > 0 ? (
        <span className="text-caption whitespace-nowrap text-muted-foreground">
          · abonado <span className="cifra">{formatearMoneda(aMonto(abonado))}</span>
        </span>
      ) : null}
    </span>
  );
}

/** HU-38 (D16): cuotas que vencen en los próximos 7 días y cuotas vencidas. */
export function CarteraPage() {
  const filtros = useFiltrosEnUrl<ClaveFiltro>();
  const parametroVista = filtros.leer('vista');
  const vista: VistaCartera = VISTAS_CARTERA.find((v) => v === parametroVista) ?? 'TODAS';
  const desde = filtros.leer('desde');
  const hasta = filtros.leer('hasta');
  const rangoInvalido = !!desde && !!hasta && desde > hasta;
  const aseguradoraId = filtros.leer('aseguradoraId');
  const [pagina, setPagina] = useState(1);
  const [generacion, setGeneracion] = useState(0);

  const aseguradoras = useCatalogoAseguradoras();
  const consulta = useCartera({
    page: pagina,
    pageSize: 20,
    vista,
    clienteId: filtros.leer('clienteId'),
    aseguradoraId,
    desde,
    hasta: rangoInvalido ? undefined : hasta,
  });
  const meta = consulta.data?.meta;
  const filtrosActivos = FILTROS.some((clave) => filtros.leer(clave));

  function filtrar(cambios: Partial<Record<ClaveFiltro, string | undefined>>) {
    filtros.cambiar(cambios);
    setPagina(1);
  }

  function limpiarFiltros() {
    filtros.cambiar(Object.fromEntries(FILTROS.map((clave) => [clave, undefined])));
    setPagina(1);
    setGeneracion((valor) => valor + 1);
  }

  return (
    <div className="grid gap-5">
      <Encabezado
        titulo="Cartera"
        descripcion="Cuotas que vencen en los próximos 7 días y cuotas vencidas, para gestionar el cobro."
      />

      <div role="group" aria-label="Vista de la cartera" className="flex flex-wrap gap-2">
        {VISTAS_CARTERA.map((opcion) => {
          const elegida = vista === opcion;
          return (
            <button
              key={opcion}
              type="button"
              aria-pressed={elegida}
              onClick={() => filtrar({ vista: opcion === 'TODAS' ? undefined : opcion })}
              className={cn(
                'inline-flex min-h-control items-center rounded-full px-4 text-label font-semibold transition-colors',
                elegida
                  ? 'bg-foreground text-background'
                  : 'bg-card text-foreground shadow-sm hover:bg-secondary',
              )}
            >
              {VISTAS[opcion].texto}
            </button>
          );
        })}
      </div>

      <LeyendaEstados dominio="cuota" />

      <div className="flex flex-wrap items-start gap-3">
        <div className="grid w-full gap-2 sm:w-64">
          <Label htmlFor="filtro-cliente-cartera">Cliente</Label>
          <SelectorCliente
            key={`cliente-${generacion}`}
            id="filtro-cliente-cartera"
            valorInicial={filtros.leer('clienteId')}
            onChange={(id) => filtrar({ clienteId: id })}
          />
        </div>
        <div className="grid w-full gap-2 sm:w-56">
          <Label htmlFor="filtro-aseguradora-cartera">Aseguradora</Label>
          <Select
            value={aseguradoraId ?? TODAS}
            onValueChange={(valor) =>
              filtrar({ aseguradoraId: valor === TODAS ? undefined : valor })
            }
          >
            <SelectTrigger id="filtro-aseguradora-cartera">
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
        <div className="w-full sm:w-44">
          <Campo id="filtro-desde-cartera" label="Vence desde">
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
            id="filtro-hasta-cartera"
            label="Vence hasta"
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
        {filtrosActivos ? (
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

      <Card className="min-w-0">
        <CardHeader className="pb-3">
          <CardTitle>{meta ? `${meta.total} cuotas` : 'Cuotas'}</CardTitle>
        </CardHeader>
        <CardContent>
          {consulta.isLoading ? (
            <EsqueletoTabla />
          ) : consulta.isError ? (
            <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
          ) : consulta.data?.data.length === 0 ? (
            <AvisoVacio
              descripcion={
                filtrosActivos
                  ? 'Pruebe con otros filtros o quítelos.'
                  : 'Las cuotas pagadas no aparecen en la cartera.'
              }
              accion={
                filtrosActivos ? (
                  <Button type="button" variant="secondary" size="sm" onClick={limpiarFiltros}>
                    Quitar filtros
                  </Button>
                ) : undefined
              }
            >
              {VISTAS[vista].vacio}
            </AvisoVacio>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Póliza</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Pendiente</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Atraso</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.data.map((fila, indice) => (
                  <TableRow
                    key={fila.cuotaId}
                    style={{ animationDelay: `${indice * 35}ms` }}
                    className="animate-fila"
                  >
                    <TableCell className="font-semibold">{fila.cliente.nombre}</TableCell>
                    <TableCell>
                      <span className="grid gap-0.5">
                        <Link
                          to={`/polizas/${fila.poliza.id}`}
                          className="cifra font-semibold whitespace-nowrap text-link underline underline-offset-3"
                        >
                          {fila.poliza.numero}
                        </Link>
                        <span className="text-caption text-muted-foreground">
                          <RamoEtiqueta codigo={fila.poliza.ramoCodigo} nombre={fila.poliza.ramo} />{' '}
                          · {fila.poliza.aseguradora}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="cifra">{fila.numero}</TableCell>
                    <TableCell className="cifra text-right whitespace-nowrap">
                      {formatearMoneda(fila.valor)}
                    </TableCell>
                    <TableCell className="cifra text-right font-semibold whitespace-nowrap">
                      {formatearMoneda(fila.pendiente)}
                    </TableCell>
                    <TableCell className="cifra whitespace-nowrap">
                      {formatearFecha(fila.fechaVencimiento)}
                    </TableCell>
                    <TableCell>
                      <DiasAtraso dias={fila.diasAtraso} />
                    </TableCell>
                    <TableCell>
                      <EstadoCuota fila={fila} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 ? (
        <nav
          aria-label="Paginación"
          className="flex flex-wrap items-center justify-end gap-2 text-muted-foreground"
        >
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
            Página {meta.page} de {meta.totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={meta.page >= meta.totalPages || consulta.isFetching}
            onClick={() => setPagina((valor) => valor + 1)}
          >
            Siguiente
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
