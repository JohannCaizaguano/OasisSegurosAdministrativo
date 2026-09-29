import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';

import { MetricsService } from './metrics.service';

/** Lo mínimo que el interceptor necesita de la petición de Express. */
interface PeticionConRuta {
  method: string;
  route?: { path?: string };
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    // El worker no registra métricas HTTP: se omite para no crear series vacías.
    if (!this.metrics.httpDuracion || !this.metrics.httpTotal) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<PeticionConRuta>();
    const response = http.getResponse<Response>();
    const inicio = process.hrtime.bigint();

    const registrar = (status: number): void => {
      const segundos = Number(process.hrtime.bigint() - inicio) / 1e9;
      const etiquetas = {
        method: request.method,
        route: request.route?.path ?? 'desconocida',
        status: String(status),
      };
      this.metrics.httpDuracion.observe(etiquetas, segundos);
      this.metrics.httpTotal.inc(etiquetas);
    };

    return next.handle().pipe(
      tap({
        next: () => registrar(response.statusCode),
        error: (error: unknown) => registrar((error as { status?: number })?.status ?? 500),
      }),
    );
  }
}
