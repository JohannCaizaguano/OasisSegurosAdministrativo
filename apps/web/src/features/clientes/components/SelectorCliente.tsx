import type { Cliente } from '@oasis/shared';

import { ComboboxBusqueda } from '@/components/ComboboxBusqueda';

import { nombreCliente } from '../nombre-cliente';
import { useCliente, useClientes } from '../hooks';

interface SelectorClienteProps {
  onChange: (clienteId: string | undefined) => void;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  placeholder?: string;
  /** Cliente ya filtrado en la URL: se muestra su nombre al recargar. */
  valorInicial?: string;
}

function useClientesActivos(q: string | undefined, habilitada: boolean) {
  const consulta = useClientes({ q, estado: 'ACTIVOS', page: 1, pageSize: 20 }, habilitada);
  return { ...consulta, data: consulta.data?.data };
}

/** Combobox de clientes activos del formulario de póliza y del filtro de `PolizasPage`. */
export function SelectorCliente({
  onChange,
  placeholder = 'Buscar cliente por nombre o identificación',
  valorInicial,
  ...resto
}: SelectorClienteProps) {
  const inicial = useCliente(valorInicial);
  return (
    <>
      <ComboboxBusqueda<Cliente>
        {...resto}
        useResultados={useClientesActivos}
        seleccionInicial={inicial.data}
        texto={nombreCliente}
        detalle={(cliente) => cliente.identificacion}
        onChange={(cliente) => onChange(cliente?.id)}
        etiquetaLista="Sugerencias de clientes"
        etiquetaQuitar="Quitar cliente seleccionado"
        mensajeError="No se pudieron cargar los clientes."
        placeholder={placeholder}
      />
      {valorInicial && inicial.isError ? (
        <p className="text-caption text-muted-foreground">
          No se pudo cargar el cliente del filtro; la lista sigue filtrada por su identificador.
        </p>
      ) : null}
    </>
  );
}
