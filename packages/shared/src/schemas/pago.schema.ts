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
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Pago = z.infer<typeof pagoSchema>;

export const validarPagoResponseSchema = z.object({
  pago: pagoSchema,
  recibo: reciboResumenSchema,
});
export type ValidarPagoResponse = z.infer<typeof validarPagoResponseSchema>;
