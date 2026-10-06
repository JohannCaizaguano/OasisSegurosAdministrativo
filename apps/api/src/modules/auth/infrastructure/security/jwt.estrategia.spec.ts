import type { AppConfig } from '../../../../config/app.config';
import type { AlmacenSesionesPort } from '../../application/ports/almacen-sesiones.port';
import { JwtEstrategia } from './jwt.estrategia';

function crearConfig(): AppConfig {
  return {
    auth: {
      accessSecret: 'a'.repeat(32),
      refreshSecret: 'b'.repeat(32),
      accessTtl: '15m',
      refreshTtl: '7d',
    },
  } as unknown as AppConfig;
}

function crearAlmacen(vive: boolean): AlmacenSesionesPort {
  return {
    abrir: jest.fn(),
    rotar: jest.fn(),
    tocar: jest.fn().mockResolvedValue(vive),
    cerrar: jest.fn(),
    cerrarDemas: jest.fn(),
  };
}

const PAYLOAD = {
  sub: '11111111-1111-1111-1111-111111111111',
  email: 'admin@oasis.com',
  rol: 'ADMIN' as const,
  sid: 'sid-1',
};

describe('JwtEstrategia', () => {
  it('devuelve el usuario con su sid si la sesión vive', async () => {
    const almacen = crearAlmacen(true);
    const estrategia = new JwtEstrategia(crearConfig(), almacen);

    await expect(estrategia.validate(PAYLOAD)).resolves.toEqual({
      id: PAYLOAD.sub,
      email: 'admin@oasis.com',
      rol: 'ADMIN',
      clienteId: null,
      sid: 'sid-1',
    });
    expect(almacen.tocar).toHaveBeenCalledWith(PAYLOAD.sub, 'sid-1');
  });

  it('responde 401 si la sesión se cerró', async () => {
    const almacen = crearAlmacen(false);
    const estrategia = new JwtEstrategia(crearConfig(), almacen);

    await expect(estrategia.validate(PAYLOAD)).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO' });
  });

  it('responde 401 si el token no trae sid', async () => {
    const almacen = crearAlmacen(true);
    const estrategia = new JwtEstrategia(crearConfig(), almacen);

    await expect(
      estrategia.validate({ sub: PAYLOAD.sub, email: PAYLOAD.email, rol: PAYLOAD.rol }),
    ).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO' });
    expect(almacen.tocar).not.toHaveBeenCalled();
  });
});
