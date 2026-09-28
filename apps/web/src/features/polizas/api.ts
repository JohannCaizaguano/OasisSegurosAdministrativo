import type { Aseguradora, Cliente, Poliza, RespuestaPaginada } from '@oasis/shared';

import { api } from '@/lib/api-client';

export const polizasApi = {
  listar: () => api.get<RespuestaPaginada<Poliza>>('/polizas?page=1&pageSize=100'),
  clientes: () => api.get<RespuestaPaginada<Cliente>>('/clientes?page=1&pageSize=100'),
  aseguradoras: () => api.get<RespuestaPaginada<Aseguradora>>('/aseguradoras?page=1&pageSize=100'),
};
