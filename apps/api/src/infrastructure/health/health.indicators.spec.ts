import type { HealthIndicatorService } from '@nestjs/terminus';

import type { PrismaService } from '../prisma/prisma.service';
import { PrismaHealthIndicator, RedisHealthIndicator } from './health.indicators';

/** Doble de `HealthIndicatorService` de Terminus: mismo contrato, sin NestJS. */
function crearIndicadorTerminus() {
  return {
    check: (clave: string) => ({
      up: () => ({ [clave]: { status: 'up' as const } }),
      down: (detalle: { message: string }) => ({
        [clave]: { status: 'down' as const, ...detalle },
      }),
    }),
  } as unknown as HealthIndicatorService;
}

describe('Indicadores de salud', () => {
  it('reporta PostgreSQL arriba cuando la consulta responde', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) };
    const indicador = new PrismaHealthIndicator(
      crearIndicadorTerminus(),
      prisma as unknown as PrismaService,
    );

    await expect(indicador.isHealthy('database')).resolves.toEqual({
      database: { status: 'up' },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('reporta PostgreSQL abajo con el mensaje del fallo', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('conexión rechazada')) };
    const indicador = new PrismaHealthIndicator(
      crearIndicadorTerminus(),
      prisma as unknown as PrismaService,
    );

    await expect(indicador.isHealthy('database')).resolves.toEqual({
      database: { status: 'down', message: 'conexión rechazada' },
    });
  });

  it('reporta Redis arriba cuando responde PONG', async () => {
    const redis = { ping: jest.fn().mockResolvedValue('PONG') };
    const indicador = new RedisHealthIndicator(crearIndicadorTerminus(), redis as unknown as never);

    await expect(indicador.isHealthy('redis')).resolves.toEqual({ redis: { status: 'up' } });
  });

  it('reporta Redis abajo cuando la respuesta no es PONG', async () => {
    const redis = { ping: jest.fn().mockResolvedValue('CARGANDO') };
    const indicador = new RedisHealthIndicator(crearIndicadorTerminus(), redis as unknown as never);

    await expect(indicador.isHealthy('redis')).resolves.toEqual({
      redis: { status: 'down', message: 'Respuesta: CARGANDO' },
    });
  });

  it('reporta Redis abajo cuando el cliente falla', async () => {
    const redis = { ping: jest.fn().mockRejectedValue(new Error('socket cerrado')) };
    const indicador = new RedisHealthIndicator(crearIndicadorTerminus(), redis as unknown as never);

    await expect(indicador.isHealthy('redis')).resolves.toEqual({
      redis: { status: 'down', message: 'socket cerrado' },
    });
  });
});
