import type { Cliente } from '@oasis/shared';

import { ComboboxBusqueda } from '@/components/ComboboxBusqueda';

import { nombreCliente } from '../nombre-cliente';
import { useClientes } from '../hooks';

interface SelectorClienteProps {
  onChange: (clienteId: string | undefined) => void;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  placeholder?: string;
}

function useClientesActivos(q: string | undefined, habilitada: boolean) {
  const consulta = useClientes({ q, estado: 'ACTIVOS', page: 1, pageSize: 20 }, habilitada);
  return { ...consulta, data: consulta.data?.data };
}

/** Combobox de clientes activos del formulario de póliza y del filtro de `PolizasPage`. */
export function SelectorCliente({
  onChange,
  placeholder = 'Buscar cliente por nombre o identificación',
  ...resto
}: SelectorClienteProps) {
  return (
    <ComboboxBusqueda<Cliente>
      {...resto}
      useResultados={useClientesActivos}
      texto={nombreCliente}
      detalle={(cliente) => cliente.identificacion}
      onChange={(cliente) => onChange(cliente?.id)}
      etiquetaLista="Sugerencias de clientes"
      etiquetaQuitar="Quitar cliente seleccionado"
      mensajeError="No se pudieron cargar los clientes."
      placeholder={placeholder}
    />
  );
}
