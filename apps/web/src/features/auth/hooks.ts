import type { LoginInput } from '@oasis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/lib/auth-store';
import { refrescarToken } from '@/lib/api-client';

import { authApi } from './api';

export function useLogin() {
  const establecerSesion = useAuthStore((estado) => estado.establecerSesion);
  return useMutation({
    mutationFn: (datos: LoginInput) => authApi.login(datos),
    onSuccess: establecerSesion,
  });
}

export function useLogout() {
  const cerrarSesionLocal = useAuthStore((estado) => estado.cerrarSesionLocal);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      cerrarSesionLocal();
      queryClient.clear();
    },
  });
}

/**
 * Restaura la sesión al cargar la SPA usando la cookie httpOnly de refresh.
 * Devuelve true cuando ya se intentó (para no mostrar los guards en falso).
 *
 * Se reutiliza `refrescarToken` del api-client, que deduplica el refresco: bajo
 * `StrictMode` el efecto se monta dos veces en desarrollo, y dos POST a
 * `/auth/refresh` con la misma cookie rotarían dos veces el mismo token de un
 * solo uso. El API lo detecta como reutilización y revoca todos los tokens,
 * dejando al usuario sin sesión en cada arranque en frío.
 */
export function useRestaurarSesion(): boolean {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vigente = true;
    void refrescarToken().finally(() => {
      if (vigente) {
        setListo(true);
      }
    });
    return () => {
      vigente = false;
    };
  }, []);

  return listo;
}
