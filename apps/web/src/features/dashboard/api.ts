import type { Pago, Poliza, ReciboResumen, RespuestaPaginada } from '@oasis/shared';

import { api } from '@/lib/api-client';

export const dashboardApi = {
  /** Últimos pagos y recibos: resumen operativo para ADMIN y OPERADOR. */
  resumenPagos: () => api.get<RespuestaPaginada<Pago>>('/pagos?page=1&pageSize=5'),
  /** Solo interesa `meta.total`: la cifra «Por validar» del inicio (The Task First Rule). */
  porValidar: () => api.get<RespuestaPaginada<Pago>>('/pagos?estado=REGISTRADO&page=1&pageSize=1'),
  resumenRecibos: () => api.get<RespuestaPaginada<ReciboResumen>>('/recibos?page=1&pageSize=5'),
  /** Datos propios del asegurado (rol CLIENTE). */
  misPolizas: () => api.get<RespuestaPaginada<Poliza>>('/mis-polizas?page=1&pageSize=20'),
  misPagos: () => api.get<RespuestaPaginada<Pago>>('/mis-pagos?page=1&pageSize=20'),
};
