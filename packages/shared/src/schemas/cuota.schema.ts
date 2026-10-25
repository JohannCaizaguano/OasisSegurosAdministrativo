import { z } from 'zod';
import { ESTADOS_CUOTA } from '../constants/estados';
import { montoDecimalSchema, montoPositivoSchema } from './common.schema';

export const MAX_CUOTAS_PLAN = 24;

export const estadoCuotaSchema = z.enum(ESTADOS_CUOTA);

export const cuotaSchema = z.object({
  id: z.uuid(),
  numero: z.number().int().positive(),
  valor: montoDecimalSchema,
  valorPagado: montoDecimalSchema,
  fechaVencimiento: z.iso.date(),
  estado: estadoCuotaSchema,
});
export type Cuota = z.infer<typeof cuotaSchema>;

/**
 * Cuerpo de `PUT /polizas/:id/cuotas` (D11). La suma contra la prima y la vigencia las valida el
 * API, que conoce la póliza.
 */
export const definirPlanCuotasSchema = z.object({
  cuotas: z
    .array(
      z.object({
        numero: z.number().int().positive(),
        valor: montoPositivoSchema,
        fechaVencimiento: z.iso.date(),
      }),
    )
    .min(1, 'El plan debe tener al menos una cuota')
    .max(MAX_CUOTAS_PLAN, `El plan admite hasta ${MAX_CUOTAS_PLAN} cuotas`)
    .superRefine((cuotas, ctx) => {
      cuotas.forEach((cuota, i) => {
        if (cuota.numero !== i + 1) {
          ctx.addIssue({
            code: 'custom',
            path: [i, 'numero'],
            message: `La cuota ${i + 1} debe tener el número ${i + 1}`,
          });
        }
        const anterior = cuotas[i - 1];
        if (anterior && cuota.fechaVencimiento <= anterior.fechaVencimiento) {
          ctx.addIssue({
            code: 'custom',
            path: [i, 'fechaVencimiento'],
            message: 'Cada vencimiento debe ser posterior al de la cuota anterior',
          });
        }
      });
    }),
});
export type DefinirPlanCuotasInput = z.infer<typeof definirPlanCuotasSchema>;
