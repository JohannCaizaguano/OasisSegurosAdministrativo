import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';

import {
  COLA_ANCLAJE_RECIBOS,
  JOB_ANCLAR_RECIBO,
  JOB_ANULAR_RECIBO,
} from '../../../../infrastructure/queue/queue.constants';
import { MetricsService } from '../../../../infrastructure/metrics/metrics.service';
import type { ConfiguracionCadenaPort } from '../../application/ports/configuracion-cadena.port';
import type { RecibosRepositoryPort } from '../../application/ports/recibos.repository.port';
import { RECIBOS_REPOSITORY } from '../../application/ports/recibos.repository.port';
import { AnclarReciboUseCase } from '../../application/use-cases/anclar-recibo.use-case';
import { AnularReciboEnCadenaUseCase } from '../../application/use-cases/anular-recibo-en-cadena.use-case';
import { Inject } from '@nestjs/common';

/**
 * Procesador de la cola `anclaje-recibos`:
 * concurrencia 1 (evita colisiones de nonce) y 5 intentos con backoff
 * exponencial configurados en QueueModule.
 */
@Injectable()
@Processor(COLA_ANCLAJE_RECIBOS, { concurrency: 1 })
export class AnclajeProcessor extends WorkerHost {
  constructor(
    private readonly anclarRecibo: AnclarReciboUseCase,
    private readonly anularRecibo: AnularReciboEnCadenaUseCase,
    @Inject(RECIBOS_REPOSITORY) private readonly recibos: RecibosRepositoryPort,
    private readonly cadena: ConfiguracionCadenaPort,
    private readonly metrics: MetricsService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(AnclajeProcessor.name);
  }

  override async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case JOB_ANCLAR_RECIBO:
        return this.procesarAnclaje(job);
      case JOB_ANULAR_RECIBO:
        return this.procesarAnulacion(job);
      default:
        throw new Error(`Job desconocido en la cola de anclaje: ${job.name}`);
    }
  }

  private async procesarAnclaje(job: Job): Promise<string> {
    const { reciboId } = job.data as { reciboId: string };
    const red = String(this.cadena.chainId);

    try {
      const salida = await this.anclarRecibo.ejecutar(reciboId);

      if (salida.estado === 'ANCLADO') {
        this.metrics.recibosAncladosTotal.inc({ red });
        if (salida.recibo.ancladoEn) {
          const latenciaMs =
            Date.parse(salida.recibo.ancladoEn) - Date.parse(salida.recibo.creadoEn);
          this.metrics.reciboAnclajeLatencia.observe({ red }, latenciaMs / 1_000);
        }
        this.logger.info({ reciboId, intento: job.attemptsMade + 1 }, 'Recibo anclado');
      }

      return salida.estado;
    } catch (error) {
      await this.registrarFallo(job, reciboId, error);
      throw error;
    }
  }

  private async procesarAnulacion(job: Job): Promise<string> {
    const { reciboId } = job.data as { reciboId: string };
    const resultado = await this.anularRecibo.ejecutar(reciboId);
    this.logger.info({ reciboId, resultado }, 'Anulación procesada');
    return resultado;
  }

  private async registrarFallo(job: Job, reciboId: string, error: unknown): Promise<void> {
    const mensaje = error instanceof Error ? error.message : String(error);
    const intentosMaximos = job.opts.attempts ?? 1;
    const esUltimoIntento = job.attemptsMade + 1 >= intentosMaximos;

    this.metrics.recibosAnclajeErroresTotal.inc({
      motivo: esUltimoIntento ? 'intentos_agotados' : 'reintento',
    });

    if (!esUltimoIntento) {
      this.logger.warn({ reciboId, intento: job.attemptsMade + 1, err: error }, 'Anclaje falló');
      return;
    }

    const recibo = await this.recibos.buscarPorId(reciboId);
    if (recibo && !recibo.estaAnclado() && !recibo.estaAnulado()) {
      recibo.marcarFallido(mensaje.slice(0, 500));
      await this.recibos.guardar(recibo);
      this.logger.error({ reciboId, err: error }, 'Anclaje fallido definitivamente');
    }
  }
}
