import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

import {
  COLA_ANCLAJE_RECIBOS,
  JOB_ANCLAR_RECIBO,
  JOB_ANULAR_RECIBO,
} from '../../../../infrastructure/queue/queue.constants';
import type { ColaAnclajePort } from '../../application/ports/cola-anclaje.port';

/**
 * Adaptador BullMQ de la cola de anclaje. jobId = reciboId garantiza que el
 * mismo recibo no se encole dos veces (deduplicación del outbox).
 */
@Injectable()
export class BullMqColaAnclajeAdapter implements ColaAnclajePort {
  constructor(@InjectQueue(COLA_ANCLAJE_RECIBOS) private readonly cola: Queue) {}

  async encolarAnclaje(reciboId: string): Promise<void> {
    await this.cola.add(JOB_ANCLAR_RECIBO, { reciboId }, { jobId: reciboId });
  }

  async encolarAnulacion(reciboId: string): Promise<void> {
    await this.cola.add(JOB_ANULAR_RECIBO, { reciboId }, { jobId: `anular:${reciboId}` });
  }

  /**
   * BullMQ deduplica por `jobId`: si ya existe, `add` no crea nada y devuelve
   * el id del job existente. Como los jobs terminados se conservan
   * (`removeOnComplete`/`removeOnFail`), un recibo que ya se procesó -en
   * particular uno que agotó sus 5 intentos y quedó en FALLIDO- quedaba
   * bloqueado: ni el reintento manual del ADMIN ni el barrido periódico
   * lograban reencolarlo, y el recibo se quedaba indefinidamente sin anclar.
   * Por eso hay que retirar el job previo antes de reencolar.
   *
   * Un job `active` no se puede quitar (BullMQ lo tiene bloqueado); en ese caso
   * se deja intacto: ya está siendo procesado y reencolarlo duplicaría trabajo.
   */
  async desencolarAnclaje(reciboId: string): Promise<void> {
    const job = await this.cola.getJob(reciboId);
    if (!job) {
      return;
    }
    const estado = await job.getState();
    if (estado === 'active') {
      return;
    }
    try {
      await job.remove();
    } catch {
      // El job pudo ser tomado por un worker entre getState() y remove().
      // Reencolar después sin quitarlo es seguro: el caso de uso es idempotente.
    }
  }
}
