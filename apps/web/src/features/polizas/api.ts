import type {
  ActualizarPolizaInput,
  Aseguradora,
  CambiarEstadoPolizaInput,
  CrearPolizaInput,
  Cuota,
  DefinirPlanCuotasInput,
  EstadoPoliza,
  OrdenPoliza,
  Poliza,
  Ramo,
  RespuestaPaginada,
} from '@oasis/shared';

import { api } from '@/lib/api-client';
import { construirQuery } from '@/lib/utils';

export interface FiltrosPolizas {
  q?: string;
  clienteId?: string;
  aseguradoraId?: string;
  estado?: EstadoPoliza;
  orden?: OrdenPoliza;
  page?: number;
  pageSize?: number;
}

export const polizasApi = {
  listar: (filtros: FiltrosPolizas = {}) =>
    api.get<RespuestaPaginada<Poliza>>(
      `/polizas${construirQuery({ page: 1, pageSize: 20, ...filtros })}`,
    ),
  crear: (datos: CrearPolizaInput) => api.post<Poliza>('/polizas', datos),
  actualizar: (id: string, datos: ActualizarPolizaInput) =>
    api.patch<Poliza>(`/polizas/${id}`, datos),
  cambiarEstado: (id: string, datos: CambiarEstadoPolizaInput) =>
    api.post<Poliza>(`/polizas/${id}/estado`, datos),
  aseguradoras: () => api.get<RespuestaPaginada<Aseguradora>>('/aseguradoras?page=1&pageSize=100'),
  cuotas: (id: string) => api.get<Cuota[]>(`/polizas/${id}/cuotas`),
  definirCuotas: (id: string, datos: DefinirPlanCuotasInput) =>
    api.put<Cuota[]>(`/polizas/${id}/cuotas`, datos),
  // D10: catálogo de solo lectura, sin paginación.
  ramos: () => api.get<Ramo[]>('/ramos'),
};
