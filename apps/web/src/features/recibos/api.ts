import type {
  EstadoRecibo,
  ReciboDetalle,
  ReciboImprimible,
  ReciboResumen,
  RegistroBitacora,
  RespuestaPaginada,
} from '@oasis/shared';

import { api } from '@/lib/api-client';
import { construirQuery } from '@/lib/utils';

export interface UltimoReintento {
  usuarioEmail: string;
  creadoEn: string;
}

export const recibosApi = {
  listar: (filtros: { page: number; pageSize: number; estado?: EstadoRecibo }) =>
    api.get<RespuestaPaginada<ReciboResumen>>(`/recibos${construirQuery({ ...filtros })}`),
  obtener: (id: string) => api.get<ReciboDetalle>(`/recibos/${id}`),
  imprimible: (id: string) => api.get<ReciboImprimible>(`/recibos/${id}/imprimible`),
  /** El API responde 404 si el recibo no es del cliente de la sesión. */
  miImprimible: (id: string) => api.get<ReciboImprimible>(`/mis-recibos/${id}/imprimible`),
  reintentar: (id: string) => api.post<ReciboDetalle>(`/recibos/${id}/reintentar`),
  /** D10: quién reintentó por última vez, leído de la bitácora (solo ADMIN). */
  ultimoReintento: async (id: string): Promise<UltimoReintento | null> => {
    const pagina = await api.get<RespuestaPaginada<RegistroBitacora>>(
      `/bitacora${construirQuery({ page: 1, pageSize: 1, accion: 'REINTENTAR', entidad: 'Recibo', entidadId: id })}`,
    );
    const registro = pagina.data[0];
    return registro ? { usuarioEmail: registro.usuarioEmail, creadoEn: registro.creadoEn } : null;
  },
};
