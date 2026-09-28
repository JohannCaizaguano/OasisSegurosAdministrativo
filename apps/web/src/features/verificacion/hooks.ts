import { useQuery } from '@tanstack/react-query';

import { verificacionApi } from './api';

/** Consulta pública (sin sesión) del estado de un recibo en la cadena. */
export function useVerificacion(codigo?: string) {
  return useQuery({
    queryKey: ['verificacion', codigo],
    queryFn: () => verificacionApi.obtener(codigo ?? ''),
    enabled: !!codigo,
    retry: false,
    staleTime: 0,
  });
}
