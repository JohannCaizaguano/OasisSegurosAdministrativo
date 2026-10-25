import type { CrearPagoInput } from '@oasis/shared';
import {
  crearPagoSchema,
  ETIQUETAS_METODO_PAGO,
  fechaEnGuayaquil,
  METODOS_PAGO,
} from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Campo } from '@/components/Campo';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/api-client';
import { formatearMoneda } from '@/lib/format';

import { useCrearPago } from '../hooks';
import { SelectorPoliza } from './SelectorPoliza';

const CAMPOS: ReadonlyArray<keyof CrearPagoInput> = [
  'polizaId',
  'monto',
  'fechaPago',
  'metodo',
  'referencia',
];

interface DetalleError {
  campo?: string;
  motivo?: string;
  saldo?: string;
}

/** El error del API va bajo su campo; RN-02 dice además cuánto queda por pagar. */
function mensajeDe(error: ApiError, detalle: DetalleError): string {
  return detalle.motivo === 'MONTO_SUPERA_SALDO' && detalle.saldo
    ? `Supera el saldo pendiente (${formatearMoneda(detalle.saldo)}).`
    : error.message;
}

/** HU-16: registra un pago REGISTRADO; validar y rechazar se hacen después, desde la fila. */
export function FormularioPago({ alGuardar }: { alGuardar: () => void }) {
  const formulario = useForm<CrearPagoInput>({
    resolver: zodResolver(crearPagoSchema),
    defaultValues: {
      polizaId: '',
      monto: '',
      fechaPago: fechaEnGuayaquil(new Date()),
      metodo: 'DEBITO_BANCARIO',
      referencia: '',
    },
  });
  const crear = useCrearPago();
  const errores = formulario.formState.errors;
  const { field: campoPoliza } = useController({ control: formulario.control, name: 'polizaId' });
  const { field: campoMetodo } = useController({ control: formulario.control, name: 'metodo' });

  function manejarError(error: unknown) {
    if (error instanceof ApiError) {
      const detalle = (error.details ?? {}) as DetalleError;
      const campo = CAMPOS.find((nombre) => nombre === detalle.campo);
      if (campo) {
        formulario.setError(campo, { message: mensajeDe(error, detalle) }, { shouldFocus: true });
        return;
      }
    }
    toast.error(error instanceof ApiError ? error.message : 'No fue posible registrar el pago');
  }

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={formulario.handleSubmit((datos) =>
        crear.mutate(datos, { onSuccess: alGuardar, onError: manejarError }),
      )}
    >
      <Campo id="pago-poliza" label="Póliza" error={errores.polizaId?.message}>
        {(atributos) => (
          <SelectorPoliza onChange={(id) => campoPoliza.onChange(id ?? '')} {...atributos} />
        )}
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="pago-monto" label="Monto" error={errores.monto?.message}>
          {(atributos) => (
            <Input
              {...atributos}
              inputMode="decimal"
              placeholder="0.00"
              {...formulario.register('monto')}
            />
          )}
        </Campo>
        <Campo id="pago-fecha" label="Fecha de pago" error={errores.fechaPago?.message}>
          {(atributos) => (
            <Input
              {...atributos}
              type="date"
              max={fechaEnGuayaquil(new Date())}
              {...formulario.register('fechaPago')}
            />
          )}
        </Campo>
      </div>

      <Campo id="pago-metodo" label="Método" error={errores.metodo?.message}>
        {(atributos) => (
          <Select value={campoMetodo.value} onValueChange={campoMetodo.onChange}>
            <SelectTrigger {...atributos}>
              <SelectValue placeholder="Seleccione el método" />
            </SelectTrigger>
            <SelectContent>
              {METODOS_PAGO.map((metodo) => (
                <SelectItem key={metodo} value={metodo}>
                  {ETIQUETAS_METODO_PAGO[metodo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Campo>

      <Campo id="pago-referencia" label="Referencia" error={errores.referencia?.message}>
        {(atributos) => (
          <Input
            {...atributos}
            maxLength={100}
            placeholder="Número de comprobante o de débito"
            {...formulario.register('referencia')}
          />
        )}
      </Campo>

      <DialogFooter>
        <Button type="submit" disabled={crear.isPending} data-testid="boton-guardar-pago">
          {crear.isPending ? 'Registrando…' : 'Registrar pago'}
        </Button>
      </DialogFooter>
    </form>
  );
}
