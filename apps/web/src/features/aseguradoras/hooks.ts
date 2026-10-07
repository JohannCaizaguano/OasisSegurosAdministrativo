import type { ActualizarAseguradoraInput, CrearAseguradoraInput } from '@oasis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { aseguradorasApi } from './api';

export function useAseguradoras(q: string, pagina: number) {
  return useQuery({
    queryKey: ['aseguradoras', q, pagina],
    queryFn: () => aseguradorasApi.listar(q, pagina),
  });
}

export function useCrearAseguradora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: CrearAseguradoraInput) => aseguradorasApi.crear(datos),
    onSuccess: () => {
      toast.success('Aseguradora creada');
      void queryClient.invalidateQueries({ queryKey: ['aseguradoras'] });
    },
  });
}

export function useEditarAseguradora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarAseguradoraInput }) =>
      aseguradorasApi.actualizar(id, datos),
    onSuccess: () => {
      toast.success('Aseguradora actualizada');
      void queryClient.invalidateQueries({ queryKey: ['aseguradoras'] });
    },
  });
}
