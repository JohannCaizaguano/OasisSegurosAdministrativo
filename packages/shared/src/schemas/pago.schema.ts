import { z } from 'zod';
import { ESTADOS_PAGO, METODOS_PAGO } from '../constants/estados';
import { montoDecimalSchema, paginacionQuerySchema } from './common.schema';
import { reciboResumenSchema } from './recibo.schema';

export const metodoPagoSchema = z.enum(METODOS_PAGO);
export const estadoPagoSchema = z.enum(ESTADOS_PAGO);

export const crearPagoSchema = z.object({
  polizaId: z.uuid(),
  monto: montoDecimalSchema,
  fechaPago: z.iso.date(),
  metodo: metodoPagoSchema,
  referencia: z.string().max(100).optional(),
});
export type CrearPagoInput = z.infer<typeof crearPagoSchema>;

export const listarPagosQuerySchema = paginacionQuerySchema.extend({
  estado: estadoPagoSchema.optional(),
  polizaId: z.uuid().optional(),
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
  q: z.string().trim().min(1).max(120).optional(),
});
export type ListarPagosQuery = z.infer<typeof listarPagosQuerySchema>;

export const pagoSchema = z.object({
  id: z.uuid(),
  polizaId: z.uuid(),
  numeroPoliza: z.string().optional(),
  monto: montoDecimalSchema,
  fechaPago: z.string(),
  metodo: metodoPagoSchema,
  referencia: z.string().nullish(),
  estado: estadoPagoSchema,
  validadoPorId: z.uuid().nullish(),
  validadoEn: z.iso.datetime().nullish(),
  /** Nota de auditoría del operador. Interna: nunca se ancla. */
  nota: z.string().nullish(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Pago = z.infer<typeof pagoSchema>;

export const validarPagoResponseSchema = z.object({
  pago: pagoSchema,
  recibo: reciboResumenSchema,
});
export type ValidarPagoResponse = z.infer<typeof validarPagoResponseSchema>;

/**
 * Cuerpo de `PATCH /pagos/:id/validar`. La nota es de auditoría interna
 * (nunca se ancla) y se exige una confirmación explícita: validar un pago emite
 * un recibo y dispara una transacción en la cadena, así que la SPA pide
 * certeza en lugar de un clic.
 */
export const validarPagoSchema = z.object({
  confirmado: z.literal(true, {
    error: 'Debe confirmar la validación para continuar',
  }),
  nota: z.string().trim().max(300).optional(),
});
export type ValidarPagoInput = z.infer<typeof validarPagoSchema>;

/** Cuerpo de `PATCH /pagos/:id/rechazar`: el motivo es obligatorio. */
export const rechazarPagoSchema = z.object({
  confirmado: z.literal(true, {
    error: 'Debe confirmar el rechazo para continuar',
  }),
  motivo: z
    .string()
    .trim()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(300, 'El motivo no puede superar los 300 caracteres'),
});
export type RechazarPagoInput = z.infer<typeof rechazarPagoSchema>;
