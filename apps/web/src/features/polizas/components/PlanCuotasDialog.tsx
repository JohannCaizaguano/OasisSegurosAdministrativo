import type { DefinirPlanCuotasInput, Poliza } from '@oasis/shared';
import {
  aCentavos,
  aMonto,
  definirPlanCuotasSchema,
  MAX_CUOTAS_PLAN,
  montoPositivoSchema,
  proponerPlanCuotas,
  sumarMontos,
} from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { AvisoError, EsqueletoTabla } from '@/components/DataState';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-client';
import { formatearFecha, formatearMoneda } from '@/lib/format';
import { cn } from '@/lib/utils';

import { useCuotas, useDefinirCuotas } from '../hooks';

interface Props {
  poliza: Poliza;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
}

/** «Cuadra», «Faltan $x» o «Sobran $x» frente a la prima (RN-15), en centavos. */
function cuadre(valores: string[], prima: string): { texto: string; cuadra: boolean } {
  if (valores.some((valor) => !montoPositivoSchema.safeParse(valor).success)) {
    return { texto: 'Revise los valores: cada cuota debe ser mayor que cero', cuadra: false };
  }
  const diferencia = aCentavos(prima) - aCentavos(sumarMontos(valores));
  if (diferencia === 0) return { texto: 'Cuadra con la prima', cuadra: true };
  const monto = formatearMoneda(aMonto(Math.abs(diferencia)));
  return { texto: diferencia > 0 ? `Faltan ${monto}` : `Sobran ${monto}`, cuadra: false };
}

function motivoSoloLectura(poliza: Poliza): string | null {
  if (poliza.estado !== 'VIGENTE') return 'La póliza no está vigente: su plan ya no cambia.';
  if (poliza.tienePagosValidados) {
    return 'El plan no se puede cambiar: la póliza ya tiene pagos validados.';
  }
  return null;
}

/** HU-35: plan actual y, si la póliza lo admite, la propuesta mensual editable (D11, D12). */
export function PlanCuotasDialog({ poliza, abierto, alCambiarAbierto }: Props) {
  const consulta = useCuotas(abierto ? poliza.id : undefined);
  const definir = useDefinirCuotas();
  const [editando, setEditando] = useState(false);
  const [numero, setNumero] = useState('3');
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const soloLectura = motivoSoloLectura(poliza);

  const formulario = useForm<DefinirPlanCuotasInput>({
    resolver: zodResolver(definirPlanCuotasSchema),
    defaultValues: { cuotas: [] },
  });
  const { fields, replace } = useFieldArray({ control: formulario.control, name: 'cuotas' });
  const filas = useWatch({ control: formulario.control, name: 'cuotas' }) ?? [];
  const estado = cuadre(
    filas.map((fila) => fila.valor),
    poliza.primaTotal,
  );
  const n = Number(numero);
  const numeroValido = Number.isInteger(n) && n >= 1 && n <= MAX_CUOTAS_PLAN;

  function proponer() {
    setErrorApi(null);
    replace(proponerPlanCuotas(poliza.primaTotal, n, poliza.fechaInicio));
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Plan de cuotas · {poliza.numero}</DialogTitle>
          <DialogDescription>
            Prima {formatearMoneda(poliza.primaTotal)} · vigencia{' '}
            {formatearFecha(poliza.fechaInicio)} – {formatearFecha(poliza.fechaFin)}
          </DialogDescription>
        </DialogHeader>

        {!editando &&
          (consulta.isLoading ? (
            <EsqueletoTabla />
          ) : consulta.isError ? (
            <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N.º</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(consulta.data ?? []).map((cuota) => (
                  <TableRow key={cuota.id}>
                    <TableCell className="cifra">{cuota.numero}</TableCell>
                    <TableCell className="cifra text-right font-semibold">
                      {formatearMoneda(cuota.valor)}
                    </TableCell>
                    <TableCell className="cifra">
                      {formatearFecha(cuota.fechaVencimiento)}
                    </TableCell>
                    <TableCell>
                      <EstadoInsignia dominio="cuota" estado={cuota.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}

        {!editando && soloLectura && (
          <p className="rounded-md bg-secondary px-3.5 py-3 text-label text-muted-foreground">
            {soloLectura}
          </p>
        )}

        {!editando && !soloLectura && (
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditando(true)}>
              Cambiar plan
            </Button>
          </DialogFooter>
        )}

        {editando && (
          <form
            noValidate
            className="grid gap-4"
            onSubmit={formulario.handleSubmit((datos) => {
              setErrorApi(null);
              definir.mutate(
                {
                  id: poliza.id,
                  datos: {
                    cuotas: datos.cuotas.map((c) => ({ ...c, valor: sumarMontos([c.valor]) })),
                  },
                },
                {
                  onSuccess: () => {
                    setEditando(false);
                    replace([]);
                  },
                  onError: (error) =>
                    setErrorApi(
                      error instanceof ApiError ? error.message : 'No fue posible guardar el plan',
                    ),
                },
              );
            })}
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid w-40 gap-1.5">
                <Label htmlFor="plan-numero">Número de cuotas</Label>
                <Input
                  id="plan-numero"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_CUOTAS_PLAN}
                  value={numero}
                  onChange={(evento) => setNumero(evento.target.value)}
                />
              </div>
              <Button type="button" variant="quiet" disabled={!numeroValido} onClick={proponer}>
                Proponer
              </Button>
            </div>

            {fields.length > 0 && (
              <>
                <ol className="grid gap-2">
                  {fields.map((campo, i) => {
                    const errorFecha = formulario.formState.errors.cuotas?.[i]?.fechaVencimiento;
                    return (
                      <li
                        key={campo.id}
                        className="grid grid-cols-[2rem_1fr_1fr] items-start gap-2"
                      >
                        <span className="cifra pt-3 text-muted-foreground">{i + 1}</span>
                        <Input
                          aria-label={`Valor de la cuota ${i + 1}`}
                          inputMode="decimal"
                          {...formulario.register(`cuotas.${i}.valor`)}
                        />
                        <div className="grid gap-1">
                          <Input
                            type="date"
                            aria-label={`Vencimiento de la cuota ${i + 1}`}
                            min={poliza.fechaInicio}
                            max={poliza.fechaFin}
                            aria-invalid={errorFecha ? true : undefined}
                            {...formulario.register(`cuotas.${i}.fechaVencimiento`)}
                          />
                          {errorFecha && (
                            <p role="alert" className="text-caption font-medium text-destructive">
                              {errorFecha.message}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <p
                  role="status"
                  className={cn(
                    'rounded-md px-3.5 py-2.5 text-label font-semibold',
                    estado.cuadra
                      ? 'bg-estado-exito-fondo text-estado-exito'
                      : 'bg-estado-aviso-fondo text-estado-aviso',
                  )}
                >
                  {estado.texto}
                </p>
              </>
            )}

            {errorApi && (
              <p role="alert" className="text-label font-medium text-destructive">
                {errorApi}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="quiet" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={fields.length === 0 || !estado.cuadra || definir.isPending}
                aria-busy={definir.isPending}
              >
                {definir.isPending ? 'Guardando…' : 'Guardar plan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
