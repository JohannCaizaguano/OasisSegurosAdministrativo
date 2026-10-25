import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { MarcarCuotasVencidasUseCase } from '../../application/use-cases/marcar-cuotas-vencidas.use-case';
import { VencimientoCuotasTask } from './vencimiento-cuotas.task';

function crear(ejecutar: jest.Mock) {
  const logger = { setContext: jest.fn(), info: jest.fn(), error: jest.fn() };
  const tarea = new VencimientoCuotasTask(
    { ejecutar } as unknown as MarcarCuotasVencidasUseCase,
    logger as unknown as PinoLogger,
  );
  return { tarea, logger };
}

describe('VencimientoCuotasTask (HU-37, D14)', () => {
  it('registra la ejecución con las cuotas actualizadas y la duración', async () => {
    const { tarea, logger } = crear(
      jest.fn().mockResolvedValue({ actualizadas: 2, duracionMs: 7 }),
    );

    await tarea.marcar();

    expect(logger.info).toHaveBeenCalledWith(
      { tarea: 'vencimiento-cuotas', actualizadas: 2, duracionMs: 7 },
      expect.any(String),
    );
  });

  it('registra también una ejecución sin cuotas que marcar', async () => {
    const { tarea, logger } = crear(
      jest.fn().mockResolvedValue({ actualizadas: 0, duracionMs: 1 }),
    );

    await tarea.marcar();

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ actualizadas: 0 }),
      expect.any(String),
    );
  });

  it('ante un error lo registra sin lanzar: la próxima ejecución reintenta', async () => {
    const { tarea, logger } = crear(jest.fn().mockRejectedValue(new Error('base caída')));

    await expect(tarea.marcar()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ tarea: 'vencimiento-cuotas', err: expect.any(Error) }),
      expect.any(String),
    );
  });

  it('se programa a las 00:05 de America/Guayaquil', async () => {
    const modulo = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [
        VencimientoCuotasTask,
        { provide: MarcarCuotasVencidasUseCase, useValue: { ejecutar: jest.fn() } },
        { provide: PinoLogger, useValue: { setContext: jest.fn() } },
      ],
    }).compile();
    await modulo.init();

    const trabajo = modulo.get(SchedulerRegistry).getCronJob('vencimiento-cuotas');
    expect(trabajo.cronTime.source).toBe('5 0 * * *');
    expect(trabajo.cronTime.timeZone).toBe('America/Guayaquil');
    await modulo.close();
  });
});
