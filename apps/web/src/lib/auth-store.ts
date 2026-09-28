import type { LoginResponse, UsuarioSesion } from '@oasis/shared';
import { create } from 'zustand';

import { configurarApiClient } from './api-client';

interface EstadoAuth {
  accessToken: string | null;
  usuario: UsuarioSesion | null;
  autenticado: boolean;
}

interface AccionesAuth {
  establecerSesion: (respuesta: LoginResponse) => void;
  cerrarSesionLocal: () => void;
}

export const useAuthStore = create<EstadoAuth & AccionesAuth>((set) => ({
  accessToken: null,
  usuario: null,
  autenticado: false,
  establecerSesion: (respuesta) =>
    set({ accessToken: respuesta.accessToken, usuario: respuesta.usuario, autenticado: true }),
  cerrarSesionLocal: () => set({ accessToken: null, usuario: null, autenticado: false }),
}));

configurarApiClient(() => useAuthStore.getState());
