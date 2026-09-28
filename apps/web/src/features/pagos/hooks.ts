import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api-client';

import { pagosApi, type FiltrosPagos } from './api';

export function usePagos(filtros: FiltrosPagos) {
  return useQuery({
    queryKey: ['pagos', filtros],
    queryFn: () => pagosApi.listar(filtros),
    placeholderData: (anterior) => anterior,
  });
}

export function useValidarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pagosApi.validar(id),
    onSuccess: (respuesta) => {
      toast.success(`Recibo ${respuesta.recibo.codigo} emitido`, {
        description: 'El anclaje en Polygon Amoy comenzó en segundo plano.',
      });
      void queryClient.invalidateQueries({ queryKey: ['pagos'] });
      void queryClient.invalidateQueries({ queryKey: ['recibos'] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No fue posible validar el pago');
    },
  });
}

export function useRechazarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pagosApi.rechazar(id),
    onSuccess: (pago) => {
      toast.success(`Pago ${pago.referencia ?? pago.id.slice(0, 8)} rechazado`);
      void queryClient.invalidateQueries({ queryKey: ['pagos'] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No fue posible rechazar el pago');
    },
  });
}
