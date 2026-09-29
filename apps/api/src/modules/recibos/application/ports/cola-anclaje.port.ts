export const COLA_ANCLAJE = Symbol('ColaAnclajePort');

/**
 * Cola del anclaje (Transactional Outbox) con `jobId = reciboId`. Reencolar un
 * job terminado debe crear uno nuevo: lo necesitan el reintento manual y el
 * barrido.
 */
export interface ColaAnclajePort {
  encolarAnclaje(reciboId: string): Promise<void>;
  encolarAnulacion(reciboId: string): Promise<void>;
  /** Elimina el job del recibo, esté en espera, activo o ya finalizado. */
  desencolarAnclaje(reciboId: string): Promise<void>;
}
