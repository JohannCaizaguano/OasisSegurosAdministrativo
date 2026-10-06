import type { AccionAuditoria, RegistroBitacora, RespuestaPaginada, Rol } from '@oasis/shared';

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

export type UsuarioFiltro = { id: string; email: string; rol: Rol };

export const auditoriaApi = {
  listar: (filtros: FiltrosBitacora) =>
    api.get<RespuestaPaginada<RegistroBitacora>>(`/bitacora${construirQuery({ ...filtros })}`),
  // ponytail: el filtro carga hasta 100 usuarios; si el personal crece, buscar por correo.
  listarUsuarios: () => api.get<RespuestaPaginada<UsuarioFiltro>>('/usuarios?pageSize=100'),
};
