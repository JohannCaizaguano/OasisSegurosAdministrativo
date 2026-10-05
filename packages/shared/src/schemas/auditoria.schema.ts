import { z } from 'zod';
import { ACCIONES_AUDITORIA } from '../constants/auditoria';
import { idUuidSchema, paginacionQuerySchema } from './common.schema';

export const accionAuditoriaSchema = z.enum(ACCIONES_AUDITORIA);

/** `desde` y `hasta` son fechas de calendario en hora de Ecuador (UTC−5), ambas inclusivas. */
export const listarBitacoraQuerySchema = paginacionQuerySchema
  .extend({
    usuarioId: idUuidSchema.optional(),
    accion: accionAuditoriaSchema.optional(),
    desde: z.iso.date().optional(),
    hasta: z.iso.date().optional(),
  })
  .refine((query) => !query.desde || !query.hasta || query.desde <= query.hasta, {
    message: 'La fecha "desde" no puede ser posterior a "hasta"',
    path: ['hasta'],
  });
export type ListarBitacoraQuery = z.infer<typeof listarBitacoraQuerySchema>;

export const registroBitacoraSchema = z.object({
  id: idUuidSchema,
  usuarioId: idUuidSchema,
  usuarioEmail: z.string(),
  accion: z.string(),
  entidad: z.string(),
  entidadId: z.string().nullable(),
  ip: z.string().nullable(),
  detalle: z.record(z.string(), z.unknown()).nullable(),
  creadoEn: z.iso.datetime(),
});
export type RegistroBitacora = z.infer<typeof registroBitacoraSchema>;
