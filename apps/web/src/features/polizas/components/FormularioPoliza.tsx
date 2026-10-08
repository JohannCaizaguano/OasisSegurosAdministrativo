import type { ActualizarPolizaInput, CrearPolizaInput, Poliza } from '@oasis/shared';
import { actualizarPolizaSchema, crearPolizaSchema } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm, type Control, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectorCliente } from '@/features/clientes/components/SelectorCliente';
import { ApiError } from '@/lib/api-client';

import { useCatalogoAseguradoras, useCrearPoliza, useEditarPoliza, useRamos } from '../hooks';

const AYUDA_PRIMA_BLOQUEADA = 'No se puede modificar: la póliza tiene pagos validados';

interface DatosFormulario {
  numero: string;
  clienteId?: string;
  aseguradoraId: string;
  ramoId: string;
  primaTotal: string;
  fechaInicio: string;
  fechaFin: string;
}

interface FormularioPolizaProps {
  poliza?: Poliza;
  alGuardar: () => void;
}

/** El cliente solo existe al crear; editarlo rompería la trazabilidad (D11). */
function CampoCliente({ control, error }: { control: Control<DatosFormulario>; error?: string }) {
  const { field } = useController({ control, name: 'clienteId' });

  return (
    <div className="grid gap-2">
      <Label htmlFor="poliza-cliente">Cliente</Label>
      <SelectorCliente
        id="poliza-cliente"
        value={field.value}
        onChange={field.onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'poliza-cliente-error' : undefined}
      />
      {error && (
        <p id="poliza-cliente-error" role="alert" className="text-sm text-[var(--destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormularioPoliza({ poliza, alGuardar }: FormularioPolizaProps) {
  const esEdicion = poliza !== undefined;
  const bloqueoPrima = esEdicion && poliza.tienePagosValidados;
  const resolver = esEdicion ? zodResolver(actualizarPolizaSchema) : zodResolver(crearPolizaSchema);
  const formulario = useForm<DatosFormulario>({
    resolver: resolver as Resolver<DatosFormulario>,
    defaultValues: esEdicion
      ? {
          numero: poliza.numero,
          aseguradoraId: poliza.aseguradoraId,
          ramoId: poliza.ramoId,
          primaTotal: poliza.primaTotal,
          fechaInicio: poliza.fechaInicio,
          fechaFin: poliza.fechaFin,
        }
      : {
          numero: '',
          clienteId: '',
          aseguradoraId: '',
          ramoId: '',
          primaTotal: '',
          fechaInicio: '',
          fechaFin: '',
        },
  });

  const crear = useCrearPoliza();
  const editar = useEditarPoliza();
  const aseguradoras = useCatalogoAseguradoras();
  const ramos = useRamos();
  const enviando = crear.isPending || editar.isPending;

  const { field: campoAseguradora } = useController({
    control: formulario.control,
    name: 'aseguradoraId',
  });
  const { field: campoRamo } = useController({ control: formulario.control, name: 'ramoId' });
  const errores = formulario.formState.errors;

  function manejarError(error: unknown) {
    const detalle =
      error instanceof ApiError ? (error.details as { campo?: string } | undefined) : undefined;
    const campo = (Object.keys(formulario.getValues()) as Array<keyof DatosFormulario>).find(
      (nombre) => nombre === detalle?.campo,
    );
    if (campo) {
      formulario.setError(campo, {
        message: error instanceof Error ? error.message : 'Dato inválido',
      });
      return;
    }
    toast.error(error instanceof ApiError ? error.message : 'No fue posible guardar la póliza');
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={formulario.handleSubmit((datos) => {
        if (esEdicion) {
          const { numero, aseguradoraId, ramoId, primaTotal, fechaInicio, fechaFin } = datos;
          editar.mutate(
            {
              id: poliza.id,
              datos: {
                numero,
                aseguradoraId,
                ramoId,
                primaTotal,
                fechaInicio,
                fechaFin,
              } as ActualizarPolizaInput,
            },
            { onSuccess: alGuardar, onError: manejarError },
          );
          return;
        }
        crear.mutate(datos as CrearPolizaInput, { onSuccess: alGuardar, onError: manejarError });
      })}
    >
      <div className="grid gap-2">
        <Label htmlFor="poliza-numero">Número</Label>
        <Input
          id="poliza-numero"
          aria-invalid={errores.numero ? true : undefined}
          aria-describedby={errores.numero ? 'poliza-numero-error' : undefined}
          {...formulario.register('numero')}
        />
        {errores.numero && (
          <p id="poliza-numero-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.numero.message}
          </p>
        )}
      </div>

      {!esEdicion && (
        <CampoCliente control={formulario.control} error={errores.clienteId?.message} />
      )}

      <div className="grid gap-2">
        <Label htmlFor="poliza-aseguradora">Aseguradora</Label>
        <Select value={campoAseguradora.value} onValueChange={campoAseguradora.onChange}>
          <SelectTrigger
            id="poliza-aseguradora"
            aria-invalid={errores.aseguradoraId ? true : undefined}
            aria-describedby={errores.aseguradoraId ? 'poliza-aseguradora-error' : undefined}
          >
            <SelectValue placeholder="Seleccione una aseguradora" />
          </SelectTrigger>
          <SelectContent>
            {(aseguradoras.data?.data ?? []).map((aseguradora) => (
              <SelectItem key={aseguradora.id} value={aseguradora.id}>
                {aseguradora.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errores.aseguradoraId && (
          <p
            id="poliza-aseguradora-error"
            role="alert"
            className="text-sm text-[var(--destructive)]"
          >
            {errores.aseguradoraId.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="poliza-ramo">Ramo</Label>
        <Select value={campoRamo.value} onValueChange={campoRamo.onChange}>
          <SelectTrigger
            id="poliza-ramo"
            aria-invalid={errores.ramoId ? true : undefined}
            aria-describedby={errores.ramoId ? 'poliza-ramo-error' : undefined}
          >
            <SelectValue placeholder="Seleccione un ramo" />
          </SelectTrigger>
          <SelectContent>
            {(ramos.data ?? []).map((ramo) => (
              <SelectItem key={ramo.id} value={ramo.id}>
                {ramo.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errores.ramoId && (
          <p id="poliza-ramo-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.ramoId.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="poliza-prima">Prima total</Label>
        <Input
          id="poliza-prima"
          inputMode="decimal"
          placeholder="0.00"
          aria-invalid={errores.primaTotal ? true : undefined}
          aria-describedby={
            errores.primaTotal
              ? 'poliza-prima-error poliza-prima-ayuda'
              : bloqueoPrima
                ? 'poliza-prima-ayuda'
                : undefined
          }
          {...formulario.register('primaTotal', { disabled: bloqueoPrima })}
        />
        {bloqueoPrima && (
          <p id="poliza-prima-ayuda" className="text-xs text-[var(--muted-foreground)]">
            {AYUDA_PRIMA_BLOQUEADA}
          </p>
        )}
        {errores.primaTotal && (
          <p id="poliza-prima-error" role="alert" className="text-sm text-[var(--destructive)]">
            {errores.primaTotal.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="poliza-fecha-inicio">Fecha de inicio</Label>
          <Input
            id="poliza-fecha-inicio"
            type="date"
            aria-invalid={errores.fechaInicio ? true : undefined}
            aria-describedby={errores.fechaInicio ? 'poliza-fecha-inicio-error' : undefined}
            {...formulario.register('fechaInicio')}
          />
          {errores.fechaInicio && (
            <p
              id="poliza-fecha-inicio-error"
              role="alert"
              className="text-sm text-[var(--destructive)]"
            >
              {errores.fechaInicio.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="poliza-fecha-fin">Fecha de fin</Label>
          <Input
            id="poliza-fecha-fin"
            type="date"
            aria-invalid={errores.fechaFin ? true : undefined}
            aria-describedby={errores.fechaFin ? 'poliza-fecha-fin-error' : undefined}
            {...formulario.register('fechaFin')}
          />
          {errores.fechaFin && (
            <p
              id="poliza-fecha-fin-error"
              role="alert"
              className="text-sm text-[var(--destructive)]"
            >
              {errores.fechaFin.message}
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={enviando} data-testid="boton-guardar-poliza">
          {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar póliza'}
        </Button>
      </DialogFooter>
    </form>
  );
}
