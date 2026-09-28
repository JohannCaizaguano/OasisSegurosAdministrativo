import type { EstadoPago, Pago, RespuestaPaginada, ValidarPagoResponse } from '@oasis/shared';

import { api } from '@/lib/api-client';
import { construirQuery } from '@/lib/utils';

export interface FiltrosPagos {
  page: number;
  pageSize: number;
  estado?: EstadoPago;
  q?: string;
}

export const pagosApi = {
  listar: (filtros: FiltrosPagos) =>
    api.get<RespuestaPaginada<Pago>>(`/pagos${construirQuery({ ...filtros })}`),
  validar: (id: string) => api.patch<ValidarPagoResponse>(`/pagos/${id}/validar`),
  rechazar: (id: string) => api.patch<Pago>(`/pagos/${id}/rechazar`),
};
