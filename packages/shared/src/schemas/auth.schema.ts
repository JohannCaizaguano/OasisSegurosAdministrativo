import { z } from 'zod';
import { rolSchema } from '../constants/roles';

export const loginSchema = z.object({
  email: z.email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const usuarioSesionSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  rol: rolSchema,
  nombre: z.string().min(1),
  clienteId: z.uuid().nullish(),
});

export type UsuarioSesion = z.infer<typeof usuarioSesionSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  usuario: usuarioSesionSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
