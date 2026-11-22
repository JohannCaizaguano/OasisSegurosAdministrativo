import { z } from 'zod';
import { VISTAS_CARTERA } from '../constants/estados';
import { estadoCuotaSchema } from './cuota.schema';
import { montoDecimalSchema, paginacionQuerySchema, validarRangoFechas } from './common.schema';

/** `GET /cuotas` (HU-38, D16): `desde` y `hasta` filtran por `fechaVencimiento`. */
export const listarCarteraQuerySchema = paginacionQuerySchema
  .extend({
    vista: z.enum(VISTAS_CARTERA).default('TODAS'),
    clienteId: z.uuid().optional(),
    aseguradoraId: z.uuid().optional(),
    desde: z.iso.date().optional(),
    hasta: z.iso.date().optional(),
  })
  .superRefine(validarRangoFechas);
export type ListarCarteraQuery = z.infer<typeof listarCarteraQuerySchema>;

export const filaCarteraSchema = z.object({
  cuotaId: z.uuid(),
  numero: z.number().int().positive(),
  valor: montoDecimalSchema,
  /** `valor − valorPagado`. */
  pendiente: montoDecimalSchema,
  fechaVencimiento: z.iso.date(),
  /** 0 si la cuota aún no vence. */
  diasAtraso: z.number().int().nonnegative(),
  estado: estadoCuotaSchema.exclude(['PAGADA']),
  poliza: z.object({
    id: z.uuid(),
    numero: z.string(),
    ramo: z.string(),
    ramoCodigo: z.string(),
    aseguradora: z.string(),
  }),
  cliente: z.object({ id: z.uuid(), nombre: z.string() }),
});
export type FilaCartera = z.infer<typeof filaCarteraSchema>;
