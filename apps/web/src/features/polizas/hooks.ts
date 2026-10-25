import type {
  ActualizarPolizaInput,
  CambiarEstadoPolizaInput,
  CrearPolizaInput,
  DefinirPlanCuotasInput,
} from '@oasis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { polizasApi, type FiltrosPolizas } from './api';

export function usePolizas(filtros: FiltrosPolizas = {}, habilitada = true) {
  return useQuery({
    queryKey: ['polizas', filtros],
    queryFn: () => polizasApi.listar(filtros),
    enabled: habilitada,
  });
}

export function useCatalogoAseguradoras() {
  return useQuery({
    queryKey: ['aseguradoras', 'catalogo'],
    queryFn: () => polizasApi.aseguradoras(),
  });
}

export function useRamos() {
  return useQuery({ queryKey: ['ramos'], queryFn: () => polizasApi.ramos() });
}

function invalidarPolizas(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['polizas'] });
}

export function useCrearPoliza() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: CrearPolizaInput) => polizasApi.crear(datos),
    onSuccess: () => {
      toast.success('Póliza registrada');
      invalidarPolizas(queryClient);
    },
  });
}

export function useEditarPoliza() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarPolizaInput }) =>
      polizasApi.actualizar(id, datos),
    onSuccess: () => {
      toast.success('Póliza actualizada');
      invalidarPolizas(queryClient);
    },
  });
}

export function useCambiarEstadoPoliza() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: CambiarEstadoPolizaInput }) =>
      polizasApi.cambiarEstado(id, datos),
    onSuccess: (_poliza, variables) => {
      toast.success(
        variables.datos.estado === 'CANCELADA' ? 'Póliza cancelada' : 'Póliza marcada como vencida',
      );
      invalidarPolizas(queryClient);
    },
  });
}

export function useCuotas(polizaId: string | undefined) {
  return useQuery({
    queryKey: ['polizas', polizaId, 'cuotas'],
    queryFn: () => polizasApi.cuotas(polizaId ?? ''),
    enabled: polizaId !== undefined,
  });
}

export function useDefinirCuotas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: DefinirPlanCuotasInput }) =>
      polizasApi.definirCuotas(id, datos),
    onSuccess: () => {
      toast.success('Plan de cuotas guardado');
      invalidarPolizas(queryClient);
    },
  });
}
