import { useQuery } from '@tanstack/react-query';

import { auditoriaApi, type FiltrosBitacora } from './api';

export function useBitacora(filtros: FiltrosBitacora) {
  return useQuery({
    queryKey: ['bitacora', filtros],
    queryFn: () => auditoriaApi.listar(filtros),
    placeholderData: (anterior) => anterior,
  });
}

export function useUsuariosParaFiltro() {
  return useQuery({
    queryKey: ['usuarios', 'filtro-bitacora'],
    queryFn: () => auditoriaApi.listarUsuarios(),
    staleTime: 5 * 60_000,
  });
}
