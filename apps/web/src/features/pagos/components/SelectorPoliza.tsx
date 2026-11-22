import type { Poliza } from '@oasis/shared';

import { ComboboxBusqueda } from '@/components/ComboboxBusqueda';
import { usePoliza, usePolizas } from '@/features/polizas/hooks';

interface SelectorPolizaProps {
  onChange: (polizaId: string | undefined) => void;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  /** El formulario de pago solo admite pólizas VIGENTES (RN-01); los filtros ven todas. */
  soloVigentes?: boolean;
  /** Póliza ya filtrada en la URL: se muestra su número al recargar. */
  valorInicial?: string;
}

// RN-01: solo las pólizas vigentes admiten pagos.
function usePolizasVigentes(q: string | undefined, habilitada: boolean) {
  const consulta = usePolizas({ q, estado: 'VIGENTE', page: 1, pageSize: 20 }, habilitada);
  return { ...consulta, data: consulta.data?.data };
}

function usePolizasDeCualquierEstado(q: string | undefined, habilitada: boolean) {
  const consulta = usePolizas({ q, page: 1, pageSize: 20 }, habilitada);
  return { ...consulta, data: consulta.data?.data };
}

export function SelectorPoliza({
  onChange,
  soloVigentes = true,
  valorInicial,
  ...resto
}: SelectorPolizaProps) {
  const inicial = usePoliza(valorInicial);
  return (
    <>
      <ComboboxBusqueda<Poliza>
        {...resto}
        useResultados={soloVigentes ? usePolizasVigentes : usePolizasDeCualquierEstado}
        seleccionInicial={inicial.data}
        texto={(poliza) => poliza.numero}
        detalle={(poliza) => poliza.clienteNombre ?? ''}
        onChange={(poliza) => onChange(poliza?.id)}
        etiquetaLista={soloVigentes ? 'Pólizas vigentes' : 'Pólizas'}
        etiquetaQuitar="Quitar póliza seleccionada"
        mensajeError="No se pudieron cargar las pólizas."
        placeholder={soloVigentes ? 'Buscar póliza vigente por número' : 'Buscar póliza por número'}
      />
      {valorInicial && inicial.isError ? (
        <p className="text-caption text-muted-foreground">
          No se pudo cargar la póliza del filtro; la lista sigue filtrada por su identificador.
        </p>
      ) : null}
    </>
  );
}
