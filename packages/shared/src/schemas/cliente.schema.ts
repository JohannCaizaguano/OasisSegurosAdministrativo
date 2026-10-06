import { z } from 'zod';
import { TIPOS_IDENTIFICACION, type TipoIdentificacion } from '../constants/estados';
import { normalizarIdentificacion, validarIdentificacion } from '../validacion/identificacion';
import { paginacionQuerySchema } from './common.schema';

export const tipoIdentificacionSchema = z.enum(TIPOS_IDENTIFICACION);

const clienteBaseSchema = z.object({
  tipoIdentificacion: tipoIdentificacionSchema,
  identificacion: z
    .string()
    .trim()
    .min(5, 'Identificación demasiado corta')
    .max(20, 'Identificación demasiado larga'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(120).optional(),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(120).optional(),
  razonSocial: z.string().trim().min(1, 'La razón social es obligatoria').max(200).optional(),
  email: z.email('Correo electrónico inválido'),
  // Un teléfono vacío es "sin teléfono", no un teléfono inválido.
  telefono: z.preprocess(
    (valor) => (valor === '' ? undefined : valor),
    z.string().trim().min(7, 'El teléfono debe tener al menos 7 caracteres').max(20).optional(),
  ),
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
        message: 'La razón social es obligatoria',
      });
    }
    return;
  }
  if (!value.nombres) {
    ctx.addIssue({
      code: 'custom',
      path: ['nombres'],
      message: 'Los nombres son obligatorios',
    });
  }
  if (!value.apellidos) {
    ctx.addIssue({
      code: 'custom',
      path: ['apellidos'],
      message: 'Los apellidos son obligatorios',
    });
  }
}

interface IdentificacionCampos {
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
}

function normalizarIdentificacionDeCliente<T extends IdentificacionCampos>(value: T): T {
  return {
    ...value,
    identificacion: normalizarIdentificacion(value.tipoIdentificacion, value.identificacion),
  };
}

function validarIdentificacionDeCliente(value: IdentificacionCampos, ctx: z.RefinementCtx) {
  const mensaje = validarIdentificacion(value.tipoIdentificacion, value.identificacion);
  if (mensaje) {
    ctx.addIssue({ code: 'custom', path: ['identificacion'], message: mensaje });
  }
}

export const crearClienteSchema = clienteBaseSchema
  .transform(normalizarIdentificacionDeCliente)
  .superRefine(validarNombrePersona)
  .superRefine(validarIdentificacionDeCliente);
export type CrearClienteInput = z.infer<typeof crearClienteSchema>;

export const actualizarClienteSchema = clienteBaseSchema
  .partial()
  .transform((value) =>
    value.tipoIdentificacion && value.identificacion
      ? normalizarIdentificacionDeCliente({
          ...value,
          tipoIdentificacion: value.tipoIdentificacion,
          identificacion: value.identificacion,
        })
      : value,
  )
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo a actualizar',
  })
  .superRefine((value, ctx) => {
    // Si llega un solo campo, el caso de uso valida contra el valor guardado (T7).
    if (value.tipoIdentificacion && value.identificacion) {
      validarIdentificacionDeCliente(
        { tipoIdentificacion: value.tipoIdentificacion, identificacion: value.identificacion },
        ctx,
      );
    }
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
