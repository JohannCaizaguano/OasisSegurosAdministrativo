import type { CrearClienteInput } from '@oasis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { clientesApi } from './api';

export function useClientes(busqueda?: string) {
  return useQuery({
    queryKey: ['clientes', busqueda ?? ''],
    queryFn: () => clientesApi.listar(busqueda),
  });
}

export function useCrearCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: CrearClienteInput) => clientesApi.crear(datos),
    onSuccess: () => {
      toast.success('Cliente creado');
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}
