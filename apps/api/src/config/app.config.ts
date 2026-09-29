import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from './env.schema';

export interface ConfiguracionRedis {
  host: string;
  port: number;
  password?: string;
}

export interface ConfiguracionThrottle {
  global: number;
  login: number;
  refresh: number;
  verificacionPublica: number;
}

export interface ConfiguracionAuth {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: string;
  refreshTtl: string;
}

export interface ConfiguracionBlockchain {
  chainId: number;
  rpcUrl: string;
  rpcUrlFallback?: string;
  contractAddress?: string;
  maxFeePerGasGwei: number;
  explorerBaseUrl: string;
}

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get esProduccion(): boolean {
    return this.nodeEnv === 'production';
  }

  get esTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get puerto(): number {
    return this.config.get('PORT', { infer: true });
  }

  get logLevel(): Env['LOG_LEVEL'] {
    return this.config.get('LOG_LEVEL', { infer: true });
  }

  get logPretty(): boolean {
    return this.config.get('LOG_PRETTY', { infer: true });
  }

  /** Nombre de la aplicación en las series de Prometheus. */
  get metricsApp(): string {
    return this.config.get('METRICS_APP', { infer: true });
  }

  /** Puerto del exporter de métricas del worker (red interna). */
  get workerMetricsPort(): number {
    return this.config.get('WORKER_METRICS_PORT', { infer: true });
  }

  /** Orígenes del SPA en desarrollo, separados por comas en `CORS_ORIGIN`. */
  get corsOrigins(): string[] {
    return this.config
      .get('CORS_ORIGIN', { infer: true })
      .split(',')
      .map((origen) => origen.trim())
      .filter((origen) => origen.length > 0);
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get redis(): ConfiguracionRedis {
    const password = this.config.get('REDIS_PASSWORD', { infer: true });
    return {
      host: this.config.get('REDIS_HOST', { infer: true }),
      port: this.config.get('REDIS_PORT', { infer: true }),
      password: password && password.length > 0 ? password : undefined,
    };
  }

  get auth(): ConfiguracionAuth {
    return {
      accessSecret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      refreshSecret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      accessTtl: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      refreshTtl: this.config.get('JWT_REFRESH_TTL', { infer: true }),
    };
  }

  get blockchain(): ConfiguracionBlockchain {
    return {
      chainId: this.config.get('CHAIN_ID', { infer: true }),
      rpcUrl: this.config.get('RPC_URL', { infer: true }),
      rpcUrlFallback: this.config.get('RPC_URL_FALLBACK', { infer: true }),
      contractAddress: this.config.get('CONTRACT_ADDRESS', { infer: true }),
      maxFeePerGasGwei: this.config.get('MAX_FEE_PER_GAS_GWEI', { infer: true }),
      explorerBaseUrl: this.config.get('EXPLORER_BASE_URL', { infer: true }),
    };
  }

  get dominio(): string {
    return this.config.get('DOMAIN', { infer: true });
  }

  get throttle(): ConfiguracionThrottle {
    return {
      global: this.config.get('THROTTLE_GLOBAL_LIMIT', { infer: true }),
      login: this.config.get('THROTTLE_LOGIN_LIMIT', { infer: true }),
      refresh: this.config.get('THROTTLE_REFRESH_LIMIT', { infer: true }),
      verificacionPublica: this.config.get('THROTTLE_VERIFICACION_PUBLICA_LIMIT', { infer: true }),
    };
  }
}
