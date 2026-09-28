import type { EstadoRecibo } from '@oasis/shared';
import { useQuery } from '@tanstack/react-query';

import { recibosApi } from './api';

export function useRecibos(filtros: { page: number; pageSize: number; estado?: EstadoRecibo }) {
  return useQuery({
    queryKey: ['recibos', filtros],
    queryFn: () => recibosApi.listar(filtros),
    placeholderData: (anterior) => anterior,
    refetchInterval: 5_000,
  });
}

export function useRecibo(id: string | undefined) {
  return useQuery({
    queryKey: ['recibo', id],
    queryFn: () => recibosApi.obtener(id as string),
    enabled: !!id,
    refetchInterval: (consulta) => {
      const estado = consulta.state.data?.estado;
      return estado === 'ANCLADO' || estado === 'ANULADO' || estado === 'FALLIDO' ? false : 3_000;
    },
  });
}
