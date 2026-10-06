import type { AlmacenSesionesPort } from '../ports/almacen-sesiones.port';
import type { EmisorTokensPort } from '../ports/emisor-tokens.port';
import { CerrarSesionUseCase } from './cerrar-sesion.use-case';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';

function crearDependencias(tokenValido = true) {
  const emisor: EmisorTokensPort = {
    emitir: jest.fn(),
    verificarRefresh: jest
      .fn()
      .mockResolvedValue(
        tokenValido
          ? { sub: USUARIO_ID, sid: 'sid-1', jti: 'jti-1', expiraEn: 1_800_000_000 }
          : null,
      ),
  };
  const almacen: AlmacenSesionesPort = {
    abrir: jest.fn(),
    rotar: jest.fn(),
    tocar: jest.fn(),
    cerrar: jest.fn(),
    cerrarDemas: jest.fn(),
    cerrarTodas: jest.fn(),
  };
  return { emisor, almacen };
}

describe('CerrarSesionUseCase', () => {
  it('cierra la sesión del sid del token', async () => {
    const deps = crearDependencias();
    const caso = new CerrarSesionUseCase(deps.emisor, deps.almacen);

    await caso.ejecutar('refresh-vigente');

    expect(deps.almacen.cerrar).toHaveBeenCalledWith(USUARIO_ID, 'sid-1');
  });

  it('sin cookie o con un token inválido no hace nada', async () => {
    const deps = crearDependencias(false);
    const caso = new CerrarSesionUseCase(deps.emisor, deps.almacen);

    await caso.ejecutar(undefined);
    await caso.ejecutar('basura');

    expect(deps.almacen.cerrar).not.toHaveBeenCalled();
  });
});
