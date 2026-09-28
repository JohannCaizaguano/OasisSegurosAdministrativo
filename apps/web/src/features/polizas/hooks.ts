import { useQuery } from '@tanstack/react-query';

import { polizasApi } from './api';

export function usePolizas() {
  return useQuery({ queryKey: ['polizas'], queryFn: () => polizasApi.listar() });
}
