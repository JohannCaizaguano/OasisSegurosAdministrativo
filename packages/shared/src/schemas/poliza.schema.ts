import { z } from 'zod';
import { ESTADOS_POLIZA } from '../constants/estados';
import { montoDecimalSchema, paginacionQuerySchema } from './common.schema';

export const estadoPolizaSchema = z.enum(ESTADOS_POLIZA);

const polizaBaseSchema = z.object({
  numero: z.string().min(1).max(50),
  clienteId: z.uuid(),
  aseguradoraId: z.uuid(),
  ramo: z.string().min(2).max(80),
  primaTotal: montoDecimalSchema,
  fechaInicio: z.iso.date(),
  fechaFin: z.iso.date(),
  estado: estadoPolizaSchema.default('VIGENTE'),
});

function validarFechas(
  value: { fechaInicio?: string; fechaFin?: string },
  ctx: z.RefinementCtx,
): void {
  if (value.fechaInicio && value.fechaFin && value.fechaFin < value.fechaInicio) {
    ctx.addIssue({
      code: 'custom',
      path: ['fechaFin'],
      message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
    });
  }
}

export const crearPolizaSchema = polizaBaseSchema.superRefine(validarFechas);
export type CrearPolizaInput = z.infer<typeof crearPolizaSchema>;

export const actualizarPolizaSchema = polizaBaseSchema
  .partial()
  .superRefine(validarFechas)
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  });
export type ActualizarPolizaInput = z.infer<typeof actualizarPolizaSchema>;

export const polizaSchema = polizaBaseSchema.extend({
  id: z.uuid(),
  clienteNombre: z.string().optional(),
  aseguradoraNombre: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Poliza = z.infer<typeof polizaSchema>;

export const listarPolizasQuerySchema = paginacionQuerySchema.extend({
  clienteId: z.uuid().optional(),
  estado: estadoPolizaSchema.optional(),
  q: z.string().trim().min(1).max(120).optional(),
});
export type ListarPolizasQuery = z.infer<typeof listarPolizasQuerySchema>;
