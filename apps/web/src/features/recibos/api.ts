import type { EstadoRecibo, ReciboDetalle, ReciboResumen, RespuestaPaginada } from '@oasis/shared';

import { api } from '@/lib/api-client';
import { construirQuery } from '@/lib/utils';

export const recibosApi = {
  listar: (filtros: { page: number; pageSize: number; estado?: EstadoRecibo }) =>
    api.get<RespuestaPaginada<ReciboResumen>>(`/recibos${construirQuery({ ...filtros })}`),
  obtener: (id: string) => api.get<ReciboDetalle>(`/recibos/${id}`),
};
