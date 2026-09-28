import type { LoginInput } from '@oasis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/lib/auth-store';

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
 */
export function useRestaurarSesion(): boolean {
  const establecerSesion = useAuthStore((estado) => estado.establecerSesion);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vigente = true;
    authApi
      .refrescar()
      .then((respuesta) => {
        if (vigente) {
          establecerSesion(respuesta);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (vigente) {
          setListo(true);
        }
      });
    return () => {
      vigente = false;
    };
  }, [establecerSesion]);

  return listo;
}
