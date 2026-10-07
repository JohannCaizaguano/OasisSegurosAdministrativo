import { z } from 'zod';
import { rolSchema } from '../constants/roles';
import { contrasenaSchema } from './auth.schema';

export const ROLES_PERSONAL = ['ADMIN', 'OPERADOR'] as const;
export type RolPersonal = (typeof ROLES_PERSONAL)[number];

export const rolPersonalSchema = z.enum(ROLES_PERSONAL);

export const crearUsuarioSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Correo electrónico inválido')),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  rol: rolPersonalSchema,
});
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

/** D7: el correo no se edita y las cuentas CLIENTE no se gestionan aquí. */
export const actualizarUsuarioSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120)
      .optional(),
    rol: rolPersonalSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  });
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;

export const usuarioSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  nombre: z.string().min(1),
  rol: rolSchema,
  activo: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Usuario = z.infer<typeof usuarioSchema>;

export const usuarioCreadoSchema = z.object({
  usuario: usuarioSchema,
  contrasenaTemporal: contrasenaSchema,
});
export type UsuarioCreado = z.infer<typeof usuarioCreadoSchema>;

export const contrasenaTemporalSchema = z.object({ contrasenaTemporal: contrasenaSchema });
export type ContrasenaTemporal = z.infer<typeof contrasenaTemporalSchema>;
