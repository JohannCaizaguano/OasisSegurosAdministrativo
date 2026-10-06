import { useQuery } from '@tanstack/react-query';

import { verificacionApi } from './api';

/** Verificación del recibo en la cadena (exige sesión, ADR-015). */
export function useVerificacion(codigo?: string) {
  return useQuery({
    queryKey: ['verificacion', codigo],
    queryFn: () => verificacionApi.obtener(codigo ?? ''),
    enabled: !!codigo,
    retry: false,
    staleTime: 0,
  });
}
