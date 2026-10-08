import type { ActualizarClienteInput, CrearClienteInput } from '@oasis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { clientesApi, type FiltrosClientes } from './api';

/** `habilitado` en false deja la consulta lista pero sin salir a la red (combobox sin abrir). */
export function useClientes(filtros: FiltrosClientes = {}, habilitado = true) {
  return useQuery({
    queryKey: ['clientes', filtros],
    queryFn: () => clientesApi.listar(filtros),
    enabled: habilitado,
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

export function useActualizarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarClienteInput }) =>
      clientesApi.actualizar(id, datos),
    onSuccess: () => {
      toast.success('Cliente actualizado');
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useDesactivarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesApi.desactivar(id),
    onSuccess: () => {
      toast.success('Cliente desactivado');
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useReactivarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesApi.reactivar(id),
    onSuccess: () => {
      toast.success('Cliente reactivado');
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}
