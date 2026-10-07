import type {
  ActualizarUsuarioInput,
  ContrasenaTemporal,
  CrearUsuarioInput,
  RespuestaPaginada,
  Usuario,
  UsuarioCreado,
} from '@oasis/shared';

import { api } from '@/lib/api-client';

export const usuariosApi = {
  listar: (page = 1, pageSize = 20) =>
    api.get<RespuestaPaginada<Usuario>>(`/usuarios?page=${page}&pageSize=${pageSize}`),
  crear: (datos: CrearUsuarioInput) => api.post<UsuarioCreado>('/usuarios', datos),
  actualizar: (id: string, datos: ActualizarUsuarioInput) =>
    api.patch<Usuario>(`/usuarios/${id}`, datos),
  desactivar: (id: string) => api.post<Usuario>(`/usuarios/${id}/desactivar`),
  reactivar: (id: string) => api.post<Usuario>(`/usuarios/${id}/reactivar`),
  restablecerContrasena: (id: string) =>
    api.post<ContrasenaTemporal>(`/usuarios/${id}/restablecer-contrasena`),
};
