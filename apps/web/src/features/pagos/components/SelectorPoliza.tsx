import type { Poliza } from '@oasis/shared';

import { ComboboxBusqueda } from '@/components/ComboboxBusqueda';
import { usePolizas } from '@/features/polizas/hooks';

interface SelectorPolizaProps {
  onChange: (polizaId: string | undefined) => void;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

// RN-01: solo las pólizas vigentes admiten pagos.
function usePolizasVigentes(q: string | undefined, habilitada: boolean) {
  const consulta = usePolizas({ q, estado: 'VIGENTE', page: 1, pageSize: 20 }, habilitada);
  return { ...consulta, data: consulta.data?.data };
}

export function SelectorPoliza({ onChange, ...resto }: SelectorPolizaProps) {
  return (
    <ComboboxBusqueda<Poliza>
      {...resto}
      useResultados={usePolizasVigentes}
      texto={(poliza) => poliza.numero}
      detalle={(poliza) => poliza.clienteNombre ?? ''}
      onChange={(poliza) => onChange(poliza?.id)}
      etiquetaLista="Pólizas vigentes"
      etiquetaQuitar="Quitar póliza seleccionada"
      mensajeError="No se pudieron cargar las pólizas."
      placeholder="Buscar póliza vigente por número"
    />
  );
}
