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
 * Restaura la sesión al cargar usando la cookie de refresh; `refrescarToken`
 * deduplica el intento (StrictMode monta el efecto dos veces).
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
