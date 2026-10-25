import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';

import { MarcarCuotasVencidasUseCase } from '../../application/use-cases/marcar-cuotas-vencidas.use-case';

const TAREA = 'vencimiento-cuotas';

/** HU-37 (D14): todos los días a las 00:05 de Ecuador continental, en el worker. */
@Injectable()
export class VencimientoCuotasTask {
  constructor(
    private readonly marcarVencidas: MarcarCuotasVencidasUseCase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VencimientoCuotasTask.name);
  }

  @Cron('5 0 * * *', { name: TAREA, timeZone: 'America/Guayaquil' })
  async marcar(): Promise<void> {
    try {
      const resultado = await this.marcarVencidas.ejecutar();
      this.logger.info({ tarea: TAREA, ...resultado }, 'Vencimiento diario de cuotas');
    } catch (error) {
      this.logger.error({ tarea: TAREA, err: error }, 'Falló el vencimiento diario de cuotas');
    }
  }
}
