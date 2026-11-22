import type { FilaCartera, RespuestaPaginada, VistaCartera } from '@oasis/shared';

import { api } from '@/lib/api-client';
import { construirQuery } from '@/lib/utils';

export interface FiltrosCartera {
  page: number;
  pageSize: number;
  vista: VistaCartera;
  clienteId?: string;
  aseguradoraId?: string;
  desde?: string;
  hasta?: string;
}

export const carteraApi = {
  listar: (filtros: FiltrosCartera) =>
    api.get<RespuestaPaginada<FilaCartera>>(`/cuotas${construirQuery({ ...filtros })}`),
};
