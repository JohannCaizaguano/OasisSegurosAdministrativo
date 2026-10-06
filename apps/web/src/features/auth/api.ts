import type {
  CambiarContrasenaInput,
  LoginInput,
  LoginResponse,
  UsuarioSesion,
} from '@oasis/shared';

import { api } from '@/lib/api-client';

export const authApi = {
  login: (datos: LoginInput) => api.post<LoginResponse>('/auth/login', datos),
  logout: () => api.post<void>('/auth/logout'),
  me: () => api.get<UsuarioSesion>('/auth/me'),
  refrescar: () => api.post<LoginResponse>('/auth/refresh'),
  cambiarContrasena: (datos: CambiarContrasenaInput) =>
    api.post<void>('/auth/cambiar-contrasena', datos),
};
