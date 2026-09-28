import { z } from 'zod';
import { TIPOS_IDENTIFICACION } from '../constants/estados';
import { paginacionQuerySchema } from './common.schema';

export const tipoIdentificacionSchema = z.enum(TIPOS_IDENTIFICACION);

const clienteBaseSchema = z.object({
  tipoIdentificacion: tipoIdentificacionSchema,
  identificacion: z
    .string()
    .min(5, 'Identificación demasiado corta')
    .max(20, 'Identificación demasiado larga'),
  nombres: z.string().min(1).max(120).optional(),
  apellidos: z.string().min(1).max(120).optional(),
  razonSocial: z.string().min(1).max(200).optional(),
  email: z.email('Correo electrónico inválido'),
  telefono: z.string().min(7).max(20).optional(),
});

function validarNombrePersona(
  value: {
    tipoIdentificacion?: string;
    nombres?: string;
    apellidos?: string;
    razonSocial?: string;
  },
  ctx: z.RefinementCtx,
) {
  if (value.tipoIdentificacion === 'RUC') {
    if (!value.razonSocial) {
      ctx.addIssue({
        code: 'custom',
        path: ['razonSocial'],
        message: 'Para RUC se requiere razón social',
      });
    }
    return;
  }
  if (!value.nombres || !value.apellidos) {
    ctx.addIssue({
      code: 'custom',
      path: ['nombres'],
      message: 'Para cédula/pasaporte se requieren nombres y apellidos',
    });
  }
}

export const crearClienteSchema = clienteBaseSchema.superRefine(validarNombrePersona);
export type CrearClienteInput = z.infer<typeof crearClienteSchema>;

export const actualizarClienteSchema = clienteBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  });
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;

export const clienteSchema = clienteBaseSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Cliente = z.infer<typeof clienteSchema>;

export const listarClientesQuerySchema = paginacionQuerySchema.extend({
  q: z.string().trim().min(1).max(120).optional(),
  tipoIdentificacion: tipoIdentificacionSchema.optional(),
});
export type ListarClientesQuery = z.infer<typeof listarClientesQuerySchema>;
