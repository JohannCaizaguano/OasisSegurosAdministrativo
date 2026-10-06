import type {
  ActualizarAseguradoraInput,
  Aseguradora,
  CrearAseguradoraInput,
  RespuestaPaginada,
} from '@oasis/shared';

import { api } from '@/lib/api-client';

export const aseguradorasApi = {
  listar: (q: string, page = 1, pageSize = 20) =>
    api.get<RespuestaPaginada<Aseguradora>>(
      `/aseguradoras?page=${page}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
    ),
  crear: (datos: CrearAseguradoraInput) => api.post<Aseguradora>('/aseguradoras', datos),
  actualizar: (id: string, datos: ActualizarAseguradoraInput) =>
    api.patch<Aseguradora>(`/aseguradoras/${id}`, datos),
};
