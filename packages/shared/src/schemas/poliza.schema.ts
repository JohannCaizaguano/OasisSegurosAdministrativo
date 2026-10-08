import { z } from 'zod';
import { ESTADOS_POLIZA } from '../constants/estados';
import { montoDecimalSchema, montoPositivoSchema, paginacionQuerySchema } from './common.schema';

export const estadoPolizaSchema = z.enum(ESTADOS_POLIZA);

const camposPoliza = {
  numero: z.string().trim().min(1, 'El número es obligatorio').max(50),
  aseguradoraId: z.uuid('Seleccione una aseguradora'),
  ramoId: z.uuid('Seleccione un ramo'),
  primaTotal: montoPositivoSchema,
  fechaInicio: z.iso.date(),
  fechaFin: z.iso.date(),
};

function validarFechas(
  value: { fechaInicio?: string; fechaFin?: string },
  ctx: z.RefinementCtx,
): void {
  if (value.fechaInicio && value.fechaFin && value.fechaFin <= value.fechaInicio) {
    ctx.addIssue({
      code: 'custom',
      path: ['fechaFin'],
      message: 'La fecha de fin debe ser posterior a la de inicio',
    });
  }
}

/** D9: sin `estado` (el caso de uso crea VIGENTE) y con `ramoId` del catálogo. */
export const crearPolizaSchema = z
  .object({ ...camposPoliza, clienteId: z.uuid('Seleccione un cliente') })
  .superRefine(validarFechas);
export type CrearPolizaInput = z.infer<typeof crearPolizaSchema>;

/** D11: `strictObject` rechaza `clienteId` y `estado`; el cliente no cambia. */
export const actualizarPolizaSchema = z
  .strictObject(camposPoliza)
  .partial()
  .superRefine(validarFechas)
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo',
  });
export type ActualizarPolizaInput = z.infer<typeof actualizarPolizaSchema>;

/** D12: solo se puede pasar de VIGENTE a uno de los dos estados terminales. */
export const cambiarEstadoPolizaSchema = z.object({
  estado: z.enum(['VENCIDA', 'CANCELADA']),
});
export type CambiarEstadoPolizaInput = z.infer<typeof cambiarEstadoPolizaSchema>;

export const polizaSchema = z.object({
  id: z.uuid(),
  ...camposPoliza,
  clienteId: z.uuid(),
  // Nombre del ramo ya resuelto por el API, para pintarlo sin otra consulta.
  ramo: z.string(),
  // La respuesta refleja lo guardado; la prima positiva se exige en la entrada.
  primaTotal: montoDecimalSchema,
  estado: estadoPolizaSchema,
  clienteNombre: z.string().optional(),
  aseguradoraNombre: z.string().optional(),
  tienePagosValidados: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Poliza = z.infer<typeof polizaSchema>;

export const ORDENES_POLIZA = ['recientes', 'fechaFinAsc', 'fechaFinDesc'] as const;
export type OrdenPoliza = (typeof ORDENES_POLIZA)[number];

export const listarPolizasQuerySchema = paginacionQuerySchema.extend({
  clienteId: z.uuid().optional(),
  aseguradoraId: z.uuid().optional(),
  estado: estadoPolizaSchema.optional(),
  q: z.string().trim().min(1).max(120).optional(),
  orden: z.enum(ORDENES_POLIZA).default('recientes'),
});
export type ListarPolizasQuery = z.infer<typeof listarPolizasQuerySchema>;
