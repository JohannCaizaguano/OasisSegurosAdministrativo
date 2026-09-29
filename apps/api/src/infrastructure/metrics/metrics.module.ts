import type { DynamicModule } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';

import { METRICS_APP } from './metrics.constants';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({})
export class MetricsModule {
  static forRoot(app: string = 'oasis-api'): DynamicModule {
    return {
      module: MetricsModule,
      global: true,
      controllers: [MetricsController],
      providers: [MetricsService, { provide: METRICS_APP, useValue: app }],
      exports: [MetricsService],
    };
  }
}
