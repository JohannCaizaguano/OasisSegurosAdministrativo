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
   * BullMQ deduplica por `jobId` y conserva los jobs terminados: hay que
   * retirar el job previo antes de reencolar. Un job `active` no se puede
   * quitar y se deja intacto (ya se está procesando).
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
      // El job pudo ser tomado entre `getState()` y `remove()`; reencolar es
      // seguro porque el caso de uso es idempotente.
    }
  }
}
