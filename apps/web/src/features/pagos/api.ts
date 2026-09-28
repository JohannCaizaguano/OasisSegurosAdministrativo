import type {
  EstadoPago,
  Pago,
  RechazarPagoInput,
  RespuestaPaginada,
  ValidarPagoInput,
  ValidarPagoResponse,
} from '@oasis/shared';

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
  // El API exige `confirmado: true`: es la garantía de que hubo una
  // confirmación explícita y no un clic accidental.
  validar: (id: string, entrada: ValidarPagoInput) =>
    api.patch<ValidarPagoResponse>(`/pagos/${id}/validar`, entrada),
  rechazar: (id: string, entrada: RechazarPagoInput) =>
    api.patch<Pago>(`/pagos/${id}/rechazar`, entrada),
};
