import type {
  ActualizarClienteInput,
  Cliente,
  CrearClienteInput,
  FiltroEstadoCliente,
  RespuestaPaginada,
} from '@oasis/shared';

import { api } from '@/lib/api-client';
import { construirQuery } from '@/lib/utils';

export interface FiltrosClientes {
  q?: string;
  estado?: FiltroEstadoCliente;
  page?: number;
  pageSize?: number;
}

export const clientesApi = {
  listar: (filtros: FiltrosClientes = {}) =>
    api.get<RespuestaPaginada<Cliente>>(
      `/clientes${construirQuery({ page: 1, pageSize: 20, estado: 'ACTIVOS', ...filtros })}`,
    ),
  crear: (datos: CrearClienteInput) => api.post<Cliente>('/clientes', datos),
  actualizar: (id: string, datos: ActualizarClienteInput) =>
    api.patch<Cliente>(`/clientes/${id}`, datos),
  // D6: idempotentes y no tocan la cuenta ni las sesiones del cliente.
  desactivar: (id: string) => api.post<Cliente>(`/clientes/${id}/desactivar`),
  reactivar: (id: string) => api.post<Cliente>(`/clientes/${id}/reactivar`),
};
