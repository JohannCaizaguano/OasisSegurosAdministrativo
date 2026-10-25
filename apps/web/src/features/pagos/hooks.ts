import type { CrearPagoInput, RechazarPagoInput, ValidarPagoInput } from '@oasis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

export function useCrearPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: CrearPagoInput) => pagosApi.crear(datos),
    onSuccess: (pago) => {
      toast.success(pago.referencia ? `Pago ${pago.referencia} registrado` : 'Pago registrado');
      void queryClient.invalidateQueries({ queryKey: ['pagos'] });
    },
  });
}

export function useValidarPago() {
  const queryClient = useQueryClient();
  const navegar = useNavigate();
  return useMutation({
    mutationFn: ({ id, entrada }: { id: string; entrada: ValidarPagoInput }) =>
      pagosApi.validar(id, entrada),
    onSuccess: (respuesta) => {
      toast.success(`Recibo ${respuesta.recibo.codigo} emitido`, {
        description: 'El anclaje en Polygon Amoy comenzó en segundo plano.',
        action: { label: 'Ver recibo', onClick: () => navegar(`/recibos/${respuesta.recibo.id}`) },
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
    mutationFn: ({ id, entrada }: { id: string; entrada: RechazarPagoInput }) =>
      pagosApi.rechazar(id, entrada),
    onSuccess: (pago) => {
      toast.success(`Pago ${pago.referencia ?? pago.id.slice(0, 8)} rechazado`);
      void queryClient.invalidateQueries({ queryKey: ['pagos'] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No fue posible rechazar el pago');
    },
  });
}
