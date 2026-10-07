import type { AccionAuditoria, RegistroBitacora, RespuestaPaginada } from '@oasis/shared';

import { api } from '@/lib/api-client';
import { construirQuery } from '@/lib/utils';

export interface FiltrosBitacora {
  page: number;
  pageSize: number;
  usuarioId?: string;
  accion?: AccionAuditoria;
  desde?: string;
  hasta?: string;
}

export type UsuarioFiltro = { id: string; email: string };

export const auditoriaApi = {
  listar: (filtros: FiltrosBitacora) =>
    api.get<RespuestaPaginada<RegistroBitacora>>(`/bitacora${construirQuery({ ...filtros })}`),
  // ponytail: lista todos los usuarios con actividad en la bitácora; si crece, buscar por correo.
  listarUsuarios: () => api.get<UsuarioFiltro[]>('/bitacora/usuarios'),
};
