export const COLA_ANCLAJE = Symbol('ColaAnclajePort');

/**
 * Cola de trabajo del anclaje (Transactional Outbox). El jobId es el id del
 * recibo, por lo que encolar dos veces el mismo recibo no duplica trabajos.
 *
 * Encolar un recibo cuyo job anterior terminó en `failed` o `completed` debe
 * volver a crear el job: es lo que permite el reintento manual del ADMIN y lo
 * que hace que el barrido pueda recuperar un recibo que agotó sus intentos.
 */
export interface ColaAnclajePort {
  encolarAnclaje(reciboId: string): Promise<void>;
  encolarAnulacion(reciboId: string): Promise<void>;
  /** Elimina el job del recibo, esté en espera, activo o ya finalizado. */
  desencolarAnclaje(reciboId: string): Promise<void>;
}
