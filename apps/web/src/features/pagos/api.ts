import type {
  CrearPagoInput,
  EstadoPago,
  Pago,
  PagoDetalle,
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
  desde?: string;
  hasta?: string;
  polizaId?: string;
  clienteId?: string;
  q?: string;
}

export const pagosApi = {
  crear: (datos: CrearPagoInput) => api.post<Pago>('/pagos', datos),
  listar: (filtros: FiltrosPagos) =>
    api.get<RespuestaPaginada<Pago>>(`/pagos${construirQuery({ ...filtros })}`),
  // El API exige `confirmado: true`: es la garantía de que hubo una
  // confirmación explícita y no un clic accidental.
  obtener: (id: string) => api.get<PagoDetalle>(`/pagos/${id}`),
  /** D26 c: solo interesa `meta.total`, la cifra de la píldora del riel. */
  porValidar: () => api.get<RespuestaPaginada<Pago>>('/pagos?estado=REGISTRADO&page=1&pageSize=1'),
  validar: (id: string, entrada: ValidarPagoInput) =>
    api.patch<ValidarPagoResponse>(`/pagos/${id}/validar`, entrada),
  rechazar: (id: string, entrada: RechazarPagoInput) =>
    api.patch<Pago>(`/pagos/${id}/rechazar`, entrada),
};
