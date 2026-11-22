import { useQuery } from '@tanstack/react-query';

import { carteraApi, type FiltrosCartera } from './api';

export function useCartera(filtros: FiltrosCartera) {
  return useQuery({
    queryKey: ['cartera', filtros],
    queryFn: () => carteraApi.listar(filtros),
    placeholderData: (anterior) => anterior,
  });
}
