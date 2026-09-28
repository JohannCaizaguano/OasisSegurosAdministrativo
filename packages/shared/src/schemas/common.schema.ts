import { z } from 'zod';

export const idUuidSchema = z.uuid();

export const idUuidParamSchema = z.object({
  id: idUuidSchema,
});

export const paginacionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginacionQuery = z.infer<typeof paginacionQuerySchema>;

export const paginacionMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type PaginacionMeta = z.infer<typeof paginacionMetaSchema>;

export function respuestaPaginadaSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    meta: paginacionMetaSchema,
  });
}

export type RespuestaPaginada<T> = {
  data: T[];
  meta: PaginacionMeta;
};

/**
 * Montos monetarios serializados como string decimal para no perder precisión
 * (en base de datos son Decimal(12,2), nunca float).
 */
export const montoDecimalSchema = z
  .string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Monto inválido: use hasta 10 enteros y 2 decimales');

export const hex32Schema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'Se espera un valor bytes32 en hex (0x + 64 hex)');

export const bigintStringSchema = z.string().regex(/^\d+$/, 'Se espera un entero no negativo');

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string(),
  timestamp: z.iso.datetime(),
  path: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
