import type { Cliente, CrearClienteInput, RespuestaPaginada } from '@oasis/shared';

import { api } from '@/lib/api-client';

export const clientesApi = {
  listar: (busqueda?: string) =>
    api.get<RespuestaPaginada<Cliente>>(
      `/clientes?page=1&pageSize=50${busqueda ? `&q=${encodeURIComponent(busqueda)}` : ''}`,
    ),
  crear: (datos: CrearClienteInput) => api.post<Cliente>('/clientes', datos),
};
