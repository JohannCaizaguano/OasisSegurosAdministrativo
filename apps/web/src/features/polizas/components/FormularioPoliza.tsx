import type { ActualizarPolizaInput, CrearPolizaInput, Poliza } from '@oasis/shared';
import { actualizarPolizaSchema, crearPolizaSchema } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm, useWatch, type Control, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import { Campo } from '@/components/Campo';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { CLASES_CAMPO, Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectorCliente } from '@/features/clientes/components/SelectorCliente';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import {
  useCatalogoAseguradoras,
  useCrearPoliza,
  useCuotas,
  useEditarPoliza,
  useRamos,
} from '../hooks';

const AYUDA_PRIMA_BLOQUEADA = 'No se puede modificar: la póliza tiene pagos validados';

interface DatosFormulario {
  numero: string;
  clienteId?: string;
  aseguradoraId: string;
  ramoId: string;
  primaTotal: string;
  fechaInicio: string;
  fechaFin: string;
  cobertura: string;
  condiciones: string;
}

const MAX_TEXTO = 2000;

/** «1 234 / 2 000»: el separador de miles es un espacio, como en los mensajes del esquema. */
function conMiles(valor: number): string {
  return String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** HU-51: texto largo con contador; los saltos de línea se guardan tal cual. */
function CampoTextoLargo({
  control,
  nombre,
  label,
  error,
}: {
  control: Control<DatosFormulario>;
  nombre: 'cobertura' | 'condiciones';
  label: string;
  error?: string;
}) {
  const { field } = useController({ control, name: nombre });
  const id = `poliza-${nombre}`;

  return (
    <Campo
      id={id}
      label={label}
      error={error}
      ayuda="Opcional. Hasta 2 000 caracteres; los saltos de línea se conservan."
    >
      {(atributos) => (
        <div className="grid gap-1">
          <textarea
            {...atributos}
            {...field}
            rows={4}
            maxLength={MAX_TEXTO}
            className={cn(CLASES_CAMPO, 'h-auto min-h-28 resize-y py-3 focus-visible:py-[11px]')}
          />
          <p className="cifra justify-self-end text-caption text-muted-foreground">
            {conMiles(field.value.length)} / {conMiles(MAX_TEXTO)}
          </p>
        </div>
      )}
    </Campo>
  );
}

interface FormularioPolizaProps {
  poliza?: Poliza;
  alGuardar: () => void;
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
          cobertura: poliza.cobertura ?? '',
          condiciones: poliza.condiciones ?? '',
        }
      : {
          numero: '',
          clienteId: '',
          aseguradoraId: '',
          ramoId: '',
          primaTotal: '',
          fechaInicio: '',
          fechaFin: '',
          cobertura: '',
          condiciones: '',
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
  // D13: con un plan de N cuotas, cambiar la prima las recalcula al guardar; se avisa antes.
  const cuotas = useCuotas(esEdicion ? poliza.id : undefined);
  const primaEscrita = useWatch({ control: formulario.control, name: 'primaTotal' });
  const totalCuotas = cuotas.data?.length ?? 0;
  const avisoRecalculo =
    esEdicion && totalCuotas > 1 && Number(primaEscrita) !== Number(poliza.primaTotal)
      ? `Al guardar se recalcularán las ${totalCuotas} cuotas con la prima nueva; sus fechas se conservan.`
      : null;

  // El cliente no se monta en edición (D11): un 422 suyo ahí solo puede ir a toast.
  const camposDelFormulario: ReadonlyArray<keyof DatosFormulario> = esEdicion
    ? [
        'numero',
        'aseguradoraId',
        'ramoId',
        'primaTotal',
        'fechaInicio',
        'fechaFin',
        'cobertura',
        'condiciones',
      ]
    : [
        'numero',
        'clienteId',
        'aseguradoraId',
        'ramoId',
        'primaTotal',
        'fechaInicio',
        'fechaFin',
        'cobertura',
        'condiciones',
      ];

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
          const {
            numero,
            aseguradoraId,
            ramoId,
            primaTotal,
            fechaInicio,
            fechaFin,
            cobertura,
            condiciones,
          } = datos;
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
                // El esquema convierte el texto vacío en `null`, que borra el guardado.
                cobertura,
                condiciones,
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

      {avisoRecalculo && (
        <p
          role="status"
          className="rounded-md bg-estado-aviso-fondo px-3.5 py-2.5 text-label text-estado-aviso"
        >
          {avisoRecalculo}
        </p>
      )}

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

      <CampoTextoLargo
        control={formulario.control}
        nombre="cobertura"
        label="Cobertura"
        error={errores.cobertura?.message}
      />
      <CampoTextoLargo
        control={formulario.control}
        nombre="condiciones"
        label="Condiciones"
        error={errores.condiciones?.message}
      />

      <DialogFooter>
        <Button type="submit" disabled={enviando} data-testid="boton-guardar-poliza">
          {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar póliza'}
        </Button>
      </DialogFooter>
    </form>
  );
}
