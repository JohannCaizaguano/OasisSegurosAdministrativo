import type { EstadoRecibo } from '@oasis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api-client';

import { recibosApi } from './api';

/** D9: el estado se vuelve a pedir cada 10 s solo mientras el registro está en curso. */
const SONDEO_MS = 10_000;

function enCurso(estado: EstadoRecibo | undefined): boolean {
  return estado === 'PENDIENTE_ANCLAJE' || estado === 'ENVIADO';
}

export function useRecibos(filtros: { page: number; pageSize: number; estado?: EstadoRecibo }) {
  return useQuery({
    queryKey: ['recibos', filtros],
    queryFn: () => recibosApi.listar(filtros),
    placeholderData: (anterior) => anterior,
    refetchInterval: (consulta) =>
      consulta.state.data?.data.some((recibo) => enCurso(recibo.estado)) ? SONDEO_MS : false,
  });
}

export function useRecibo(id: string | undefined) {
  return useQuery({
    queryKey: ['recibo', id],
    queryFn: () => recibosApi.obtener(id as string),
    enabled: !!id,
    refetchInterval: (consulta) => (enCurso(consulta.state.data?.estado) ? SONDEO_MS : false),
  });
}

/** D8: la misma hoja para el personal y para el cliente; cambia solo la fuente. */
export function useReciboImprimible(id: string | undefined, esCliente: boolean) {
  return useQuery({
    queryKey: ['recibo', id, 'imprimible', esCliente],
    queryFn: () =>
      esCliente ? recibosApi.miImprimible(id as string) : recibosApi.imprimible(id as string),
    enabled: !!id,
  });
}

export function useUltimoReintento(id: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['recibo', id, 'ultimo-reintento'],
    queryFn: () => recibosApi.ultimoReintento(id),
    enabled: habilitado,
  });
}

export function useReintentarRecibo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recibosApi.reintentar(id),
    onSuccess: (recibo) => {
      toast.success(`Recibo ${recibo.codigo} enviado de nuevo`, {
        description: 'Se está registrando para que pueda verificarse.',
      });
      void queryClient.invalidateQueries({ queryKey: ['recibo', recibo.id] });
      void queryClient.invalidateQueries({ queryKey: ['recibos'] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'No fue posible reintentar el recibo',
      );
    },
  });
}
