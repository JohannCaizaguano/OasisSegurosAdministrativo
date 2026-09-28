import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';

import { MetricsService } from '../../../../infrastructure/metrics/metrics.service';
import {
  CONFIG_CADENA,
  type ConfiguracionCadenaPort,
} from '../../application/ports/configuracion-cadena.port';
import { ReencolarPendientesUseCase } from '../../application/use-cases/reencolar-pendientes.use-case';

const INTERVALO_MS = 30_000;

/**
 * Barrido del outbox cada 30 s: reencola los recibos en PENDIENTE_ANCLAJE con
 * más de 60 s de antigüedad (recuperación ante caídas del worker o de Redis).
 */
@Injectable()
export class BarridoPendientesTask {
  private enCurso = false;

  constructor(
    private readonly reencolar: ReencolarPendientesUseCase,
    private readonly metrics: MetricsService,
    @Inject(CONFIG_CADENA) private readonly cadena: ConfiguracionCadenaPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BarridoPendientesTask.name);
  }

  @Interval(INTERVALO_MS)
  async barrer(): Promise<void> {
    if (this.enCurso) {
      return;
    }
    this.enCurso = true;
    try {
      const resultado = await this.reencolar.ejecutar();
      this.metrics.recibosPendientes.set(
        { red: String(this.cadena.chainId) },
        resultado.pendientes,
      );
      if (resultado.reencolados > 0) {
        this.logger.info(resultado, 'Barrido de recibos pendientes');
      }
    } catch (error) {
      this.logger.error({ err: error }, 'Falló el barrido de recibos pendientes');
    } finally {
      this.enCurso = false;
    }
  }
}
