import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from './api';

export function useResumenPagos() {
  return useQuery({
    queryKey: ['pagos', 'resumen'],
    queryFn: () => dashboardApi.resumenPagos(),
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
