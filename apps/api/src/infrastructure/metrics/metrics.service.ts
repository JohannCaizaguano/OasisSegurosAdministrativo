import { Inject, Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

import { METRICS_APP } from './metrics.constants';

/**
 * Registro de métricas Prometheus del API y del worker (ISO/IEC 25023).
 * - http_request_duration_seconds / http_requests_total: latencia y RPS del API.
 * - recibos_anclados_total / recibos_pendientes_anclaje: salud del outbox.
 * - recibo_anclaje_latencia_segundos: tiempo entre creación del recibo y anclaje.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly app: string;

  readonly httpDuracion: Histogram<'method' | 'route' | 'status'>;
  readonly httpTotal: Counter<'method' | 'route' | 'status'>;
  readonly recibosAncladosTotal: Counter<'red'>;
  readonly recibosAnclajeErroresTotal: Counter<'motivo'>;
  readonly reciboAnclajeLatencia: Histogram<'red'>;
  readonly recibosPendientes: Gauge<'red'>;

  constructor(@Inject(METRICS_APP) app: string) {
    // La etiqueta `app` distingue API y worker en Prometheus.
    this.app = app;
    this.registry.setDefaultLabels({ app: this.app });
    collectDefaultMetrics({ register: this.registry });

    // En el worker no hay tráfico HTTP: estas métricas solo añadirían ruido.
    if (this.app === 'oasis-api') {
      this.httpDuracion = new Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duración de las peticiones HTTP en segundos',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
        registers: [this.registry],
      });

      this.httpTotal = new Counter({
        name: 'http_requests_total',
        help: 'Total de peticiones HTTP',
        labelNames: ['method', 'route', 'status'],
        registers: [this.registry],
      });
    }

    this.recibosAncladosTotal = new Counter({
      name: 'recibos_anclados_total',
      help: 'Total de recibos anclados en la cadena',
      labelNames: ['red'],
      registers: [this.registry],
    });

    this.recibosAnclajeErroresTotal = new Counter({
      name: 'recibos_anclaje_errores_total',
      help: 'Errores de anclaje por motivo',
      labelNames: ['motivo'],
      registers: [this.registry],
    });

    this.reciboAnclajeLatencia = new Histogram({
      name: 'recibo_anclaje_latencia_segundos',
      help: 'Segundos entre la emisión del recibo y su anclaje',
      labelNames: ['red'],
      buckets: [1, 5, 10, 30, 60, 120, 300, 600],
      registers: [this.registry],
    });

    this.recibosPendientes = new Gauge({
      name: 'recibos_pendientes_anclaje',
      help: 'Recibos en estado PENDIENTE_ANCLAJE o ENVIADO',
      labelNames: ['red'],
      registers: [this.registry],
    });
  }

  async metricas(): Promise<string> {
    return this.registry.metrics();
  }
}
