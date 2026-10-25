import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from './api';

export function useResumenPagos() {
  return useQuery({
    queryKey: ['pagos', 'resumen'],
    queryFn: () => dashboardApi.resumenPagos(),
  });
}

export function usePorValidar() {
  return useQuery({
    queryKey: ['pagos', 'por-validar'],
    queryFn: () => dashboardApi.porValidar(),
  });
}

export function useResumenRecibos() {
  return useQuery({
    queryKey: ['recibos', 'resumen'],
    queryFn: () => dashboardApi.resumenRecibos(),
  });
}

export function useMisPolizas() {
  return useQuery({
    queryKey: ['mis-polizas'],
    queryFn: () => dashboardApi.misPolizas(),
  });
}

export function useMisPagos() {
  return useQuery({
    queryKey: ['mis-pagos'],
    queryFn: () => dashboardApi.misPagos(),
  });
}

export function useSaldoOperadora() {
  return useQuery({
    queryKey: ['operadora', 'saldo'],
    queryFn: () => dashboardApi.saldoOperadora(),
    // El worker lo refresca cada 5 min; el panel mira cada minuto.
    refetchInterval: 60_000,
  });
}
