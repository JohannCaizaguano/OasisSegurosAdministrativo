import { z } from 'zod';

const polSchema = z.string().regex(/^\d+(\.\d+)?$/, 'Se espera un saldo decimal en POL');

/** Respuesta de `GET /operadora/saldo` (HU-42, D17): el worker la deja en Redis con TTL. */
export const saldoOperadoraSchema = z.discriminatedUnion('disponible', [
  z.object({
    disponible: z.literal(true),
    pol: polSchema,
    umbralPol: polSchema,
    bajoUmbral: z.boolean(),
    actualizadoEn: z.iso.datetime(),
  }),
  z.object({ disponible: z.literal(false) }),
]);
export type SaldoOperadora = z.infer<typeof saldoOperadoraSchema>;
