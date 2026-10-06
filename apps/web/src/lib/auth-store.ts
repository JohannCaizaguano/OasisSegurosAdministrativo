import type { LoginResponse, UsuarioSesion } from '@oasis/shared';
import { create } from 'zustand';

import { configurarApiClient } from './api-client';

/** Por qué terminó la última sesión; el login lo muestra hasta el siguiente ingreso. */
export type MotivoCierre = 'inactividad' | 'expirada';

interface EstadoAuth {
  accessToken: string | null;
  usuario: UsuarioSesion | null;
  autenticado: boolean;
  motivoCierre: MotivoCierre | null;
}

interface AccionesAuth {
  establecerSesion: (respuesta: LoginResponse) => void;
  cerrarSesionLocal: (motivo?: MotivoCierre) => void;
}

export const useAuthStore = create<EstadoAuth & AccionesAuth>((set) => ({
  accessToken: null,
  usuario: null,
  autenticado: false,
  motivoCierre: null,
  establecerSesion: (respuesta) =>
    set({
      accessToken: respuesta.accessToken,
      usuario: respuesta.usuario,
      autenticado: true,
      motivoCierre: null,
    }),
  cerrarSesionLocal: (motivo) =>
    set({ accessToken: null, usuario: null, autenticado: false, motivoCierre: motivo ?? null }),
}));

configurarApiClient(() => useAuthStore.getState());
