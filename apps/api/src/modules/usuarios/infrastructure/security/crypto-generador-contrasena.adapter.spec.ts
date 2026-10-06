import { CryptoGeneradorContrasenaAdapter } from './crypto-generador-contrasena.adapter';

describe('CryptoGeneradorContrasenaAdapter', () => {
  it('genera 16 caracteres alfanuméricos distintos entre llamadas', () => {
    const generador = new CryptoGeneradorContrasenaAdapter();

    const primera = generador.generar();
    const segunda = generador.generar();

    expect(primera).toMatch(/^[A-Za-z0-9]{16}$/);
    expect(segunda).toMatch(/^[A-Za-z0-9]{16}$/);
    expect(primera).not.toBe(segunda);
  });
});
