import type { CrearPagoInput, RechazarPagoInput, ValidarPagoInput } from '@oasis/shared';
import { fechaEnGuayaquil } from '@oasis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useCuotas } from '@/features/polizas/hooks';
import { ApiError } from '@/lib/api-client';

import { pagosApi, type FiltrosPagos } from './api';
import { vistaPreviaAplicacion, type VistaPrevia } from './vista-previa';

export function usePagos(filtros: FiltrosPagos) {
  return useQuery({
    queryKey: ['pagos', filtros],
    queryFn: () => pagosApi.listar(filtros),
    placeholderData: (anterior) => anterior,
  });
}

export function usePago(id: string | undefined) {
  return useQuery({
    queryKey: ['pagos', 'detalle', id],
    queryFn: () => pagosApi.obtener(id as string),
    enabled: !!id,
  });
}

/** D26 c: sin sondeo; registrar, validar y rechazar invalidan `['pagos']` y la refrescan. */
export function usePagosPorValidar(habilitada: boolean) {
  return useQuery({
    queryKey: ['pagos', 'por-validar'],
    queryFn: () => pagosApi.porValidar(),
    enabled: habilitada,
    staleTime: 30_000,
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
        description: 'El recibo se está registrando para que pueda verificarse.',
        action: { label: 'Ver recibo', onClick: () => navegar(`/recibos/${respuesta.recibo.id}`) },
      });
      void queryClient.invalidateQueries({ queryKey: ['pagos'] });
      void queryClient.invalidateQueries({ queryKey: ['recibos'] });
      // HU-36: validar aplica el pago a las cuotas de la póliza y cambia la cartera.
      void queryClient.invalidateQueries({ queryKey: ['polizas'] });
      void queryClient.invalidateQueries({ queryKey: ['cartera'] });
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

/** D24: lo que el pago haría con las cuotas de la póliza; `null` mientras falten datos. */
export function useVistaPrevia(polizaId: string | undefined, monto: string): VistaPrevia | null {
  const cuotas = useCuotas(polizaId || undefined);
  return cuotas.data
    ? vistaPreviaAplicacion(cuotas.data, monto, fechaEnGuayaquil(new Date()))
    : null;
}
