import { z } from 'zod';
import { paginacionQuerySchema } from './common.schema';

export const crearAseguradoraSchema = z.object({
  nombre: z.string().min(2).max(200),
  ruc: z.string().regex(/^\d{13}$/, 'El RUC debe tener 13 dígitos'),
});
export type CrearAseguradoraInput = z.infer<typeof crearAseguradoraSchema>;

export const actualizarAseguradoraSchema = crearAseguradoraSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  });
export type ActualizarAseguradoraInput = z.infer<typeof actualizarAseguradoraSchema>;

export const aseguradoraSchema = crearAseguradoraSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Aseguradora = z.infer<typeof aseguradoraSchema>;

export const listarAseguradorasQuerySchema = paginacionQuerySchema.extend({
  q: z.string().trim().min(1).max(120).optional(),
});
export type ListarAseguradorasQuery = z.infer<typeof listarAseguradorasQuerySchema>;
