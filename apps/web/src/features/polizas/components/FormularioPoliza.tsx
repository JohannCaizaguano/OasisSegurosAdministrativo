import type { ActualizarPolizaInput, CrearPolizaInput, Poliza } from '@oasis/shared';
import { actualizarPolizaSchema, crearPolizaSchema } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm, type Control, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

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

interface AtributosCampo {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

interface CampoProps {
  id: string;
  label: string;
  error?: string;
  /** Ayuda permanente del control; su id se enlaza junto con el del error. */
  ayuda?: string;
  children: (atributos: AtributosCampo) => ReactNode;
}

/** Label, control, ayuda y error de un campo, con el ARIA consistente en un solo sitio. */
function Campo({ id, label, error, ayuda, children }: CampoProps) {
  const descrito = [error ? `${id}-error` : null, ayuda ? `${id}-ayuda` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': descrito || undefined,
      })}
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-xs text-[var(--muted-foreground)]">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-[var(--destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}

/** El cliente solo existe al crear; editarlo rompería la trazabilidad (D11). */
function CampoCliente({ control, error }: { control: Control<DatosFormulario>; error?: string }) {
  const { field } = useController({ control, name: 'clienteId' });

  return (
    <Campo id="poliza-cliente" label="Cliente" error={error}>
      {(atributos) => <SelectorCliente onChange={field.onChange} {...atributos} />}
    </Campo>
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

  // El cliente no se monta en edición (D11): un 422 suyo ahí solo puede ir a toast.
  const camposDelFormulario: ReadonlyArray<keyof DatosFormulario> = esEdicion
    ? ['numero', 'aseguradoraId', 'ramoId', 'primaTotal', 'fechaInicio', 'fechaFin']
    : ['numero', 'clienteId', 'aseguradoraId', 'ramoId', 'primaTotal', 'fechaInicio', 'fechaFin'];

  function manejarError(error: unknown) {
    const detalle =
      error instanceof ApiError ? (error.details as { campo?: string } | undefined) : undefined;
    const campo = camposDelFormulario.find((nombre) => nombre === detalle?.campo);
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
      <Campo id="poliza-numero" label="Número" error={errores.numero?.message}>
        {(atributos) => <Input {...atributos} {...formulario.register('numero')} />}
      </Campo>

      {!esEdicion && (
        <CampoCliente control={formulario.control} error={errores.clienteId?.message} />
      )}

      <Campo id="poliza-aseguradora" label="Aseguradora" error={errores.aseguradoraId?.message}>
        {(atributos) => (
          <Select value={campoAseguradora.value} onValueChange={campoAseguradora.onChange}>
            <SelectTrigger {...atributos}>
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
        )}
      </Campo>

      <Campo id="poliza-ramo" label="Ramo" error={errores.ramoId?.message}>
        {(atributos) => (
          <Select value={campoRamo.value} onValueChange={campoRamo.onChange}>
            <SelectTrigger {...atributos}>
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
        )}
      </Campo>

      <Campo
        id="poliza-prima"
        label="Prima total"
        error={errores.primaTotal?.message}
        ayuda={bloqueoPrima ? AYUDA_PRIMA_BLOQUEADA : undefined}
      >
        {(atributos) => (
          <Input
            {...atributos}
            inputMode="decimal"
            placeholder="0.00"
            {...formulario.register('primaTotal', { disabled: bloqueoPrima })}
          />
        )}
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="poliza-fecha-inicio"
          label="Fecha de inicio"
          error={errores.fechaInicio?.message}
        >
          {(atributos) => (
            <Input {...atributos} type="date" {...formulario.register('fechaInicio')} />
          )}
        </Campo>
        <Campo id="poliza-fecha-fin" label="Fecha de fin" error={errores.fechaFin?.message}>
          {(atributos) => <Input {...atributos} type="date" {...formulario.register('fechaFin')} />}
        </Campo>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={enviando} data-testid="boton-guardar-poliza">
          {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar póliza'}
        </Button>
      </DialogFooter>
    </form>
  );
}
