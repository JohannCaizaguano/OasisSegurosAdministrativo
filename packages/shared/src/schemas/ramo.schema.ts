import { z } from 'zod';

/** Proyección del catálogo de ramos activos que consume `GET /ramos`. */
export const ramoSchema = z.object({
  id: z.uuid(),
  codigo: z.string(),
  nombre: z.string(),
});
export type Ramo = z.infer<typeof ramoSchema>;
