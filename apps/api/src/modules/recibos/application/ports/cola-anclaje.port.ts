export const COLA_ANCLAJE = Symbol('ColaAnclajePort');

/**
 * Cola de trabajo del anclaje (Transactional Outbox). El jobId es el id del
 * recibo, por lo que encolar dos veces el mismo recibo no duplica trabajos.
 */
export interface ColaAnclajePort {
  encolarAnclaje(reciboId: string): Promise<void>;
  encolarAnulacion(reciboId: string): Promise<void>;
}
