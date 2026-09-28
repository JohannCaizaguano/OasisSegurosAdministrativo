import { z } from 'zod';
import { ESTADOS_RECIBO, ESTADOS_VERIFICACION } from '../constants/estados';
import { bigintStringSchema, hex32Schema, paginacionQuerySchema } from './common.schema';

export const estadoReciboSchema = z.enum(ESTADOS_RECIBO);
export const estadoVerificacionSchema = z.enum(ESTADOS_VERIFICACION);

export const txHashSchema = z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Hash de transacción inválido');

export const reciboResumenSchema = z.object({
  id: z.uuid(),
  codigo: z.string().min(6).max(32),
  estado: estadoReciboSchema,
  idOnchain: hex32Schema,
  hashRecibo: hex32Schema,
  txHash: txHashSchema.nullish(),
  creadoEn: z.iso.datetime(),
  enviadoEn: z.iso.datetime().nullish(),
  ancladoEn: z.iso.datetime().nullish(),
});
export type ReciboResumen = z.infer<typeof reciboResumenSchema>;

export const reciboDetalleSchema = reciboResumenSchema.extend({
  pagoId: z.uuid(),
  numeroPoliza: z.string(),
  payloadCanonico: z.string(),
  blockNumber: bigintStringSchema.nullish(),
  gasUsed: bigintStringSchema.nullish(),
  effectiveGasPrice: bigintStringSchema.nullish(),
  chainId: z.number().int(),
  contractAddress: z.string(),
  intentos: z.number().int().nonnegative(),
  ultimoError: z.string().nullish(),
  explorerUrl: z.string().nullish(),
});
export type ReciboDetalle = z.infer<typeof reciboDetalleSchema>;

export const listarRecibosQuerySchema = paginacionQuerySchema.extend({
  estado: estadoReciboSchema.optional(),
});
export type ListarRecibosQuery = z.infer<typeof listarRecibosQuerySchema>;

/**
 * Respuesta pública de verificación. NUNCA incluye datos personales:
 * solo identificadores opacos, hashes, estado y metadatos de la cadena.
 */
/**
 * Código público del recibo (`RC-` + 12 hex). Se valida en el endpoint público
 * para que una cadena arbitraria no llegue a la consulta a la base de datos.
 */
export const codigoReciboSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^RC-[0-9A-F]{12}$/, 'El código del recibo tiene el formato RC-XXXXXXXXXXXX');

export const verificacionPublicaSchema = z.object({
  codigo: z.string(),
  estado: estadoVerificacionSchema,
  hashRecibo: hex32Schema,
  hashOnchain: hex32Schema.nullish(),
  txHash: txHashSchema.nullish(),
  blockNumber: bigintStringSchema.nullish(),
  ancladoEn: z.iso.datetime().nullish(),
  chainId: z.number().int(),
  // null solo cuando el código no existe y el contrato aún no está desplegado.
  contractAddress: z.string().nullish(),
  explorerUrl: z.string().nullish(),
  verificadoEn: z.iso.datetime(),
});
export type VerificacionPublica = z.infer<typeof verificacionPublicaSchema>;
