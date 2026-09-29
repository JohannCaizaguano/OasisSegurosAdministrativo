import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { Public } from '../../common/auth/decorators';
import { MetricsService } from './metrics.service';

/**
 * GET /metrics, excluido del prefijo global y no publicado por Caddy: solo
 * accesible desde la red interna (Prometheus).
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiExcludeEndpoint()
  async obtener(): Promise<string> {
    return this.metrics.metricas();
  }
}
