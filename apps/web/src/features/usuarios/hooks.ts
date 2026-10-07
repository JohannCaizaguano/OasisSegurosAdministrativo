import type { ActualizarUsuarioInput, CrearUsuarioInput } from '@oasis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { usuariosApi } from './api';

export function useUsuarios(pagina: number) {
  return useQuery({
    queryKey: ['usuarios', pagina],
    queryFn: () => usuariosApi.listar(pagina),
  });
}

export function useCrearUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: CrearUsuarioInput) => usuariosApi.crear(datos),
    onSuccess: () => {
      toast.success('Usuario creado');
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useEditarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarUsuarioInput }) =>
      usuariosApi.actualizar(id, datos),
    onSuccess: () => {
      toast.success('Usuario actualizado');
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usuariosApi.desactivar(id),
    onSuccess: () => {
      toast.success('Usuario desactivado; se cerraron sus sesiones');
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useReactivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usuariosApi.reactivar(id),
    onSuccess: () => {
      toast.success('Usuario reactivado');
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useRestablecerContrasena() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usuariosApi.restablecerContrasena(id),
    onSuccess: () => {
      toast.success('Contraseña restablecida; se cerraron sus sesiones');
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}
