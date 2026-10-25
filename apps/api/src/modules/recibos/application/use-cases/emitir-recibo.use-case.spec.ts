import { HashRecibo } from '../../domain/hash-recibo';
import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { CriptoPort } from '../ports/cripto.port';
import type { HasherRecibosPort } from '../ports/hasher-recibos.port';
import { EmitirReciboUseCase } from './emitir-recibo.use-case';

const SAL = `0x${'ab'.repeat(32)}`;
const HASH = `0x${'cd'.repeat(32)}`;
const ID_ONCHAIN = `0x${'ef'.repeat(32)}`;

function crearCaso() {
  const cripto: CriptoPort = {
    generarId: () => '5f0c6d3e-1111-4222-8333-444455556666',
    generarCodigo: () => 'RC-0A1B2C3D4E5F',
    generarSal: () => SAL,
  };
  const hasher = {
    hashRecibo: jest.fn((_payload: string, sal: string) => HashRecibo.de(HASH, sal)),
    hashTexto: jest.fn(() => ID_ONCHAIN),
  };
  const cadena = {
    chainId: 31337,
    obtenerContractAddress: () => '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  } as unknown as ConfiguracionCadenaPort;
  const clock: ClockPort = { ahora: () => new Date('2026-10-24T15:00:00.000Z') };
  const caso = new EmitirReciboUseCase(cripto, hasher as HasherRecibosPort, cadena, clock);
  return { caso, hasher };
}

const DATOS = {
  pagoId: '22222222-2222-4222-8222-222222222222',
  numeroPoliza: 'POL-2026-0001',
  monto: '120.13',
  fechaPago: '2026-10-24',
};

describe('EmitirReciboUseCase (HU-22)', () => {
  it('usa el código público del puerto de cripto (RN-12) y la sal de 32 bytes', () => {
    const { caso } = crearCaso();

    const recibo = caso.ejecutar(DATOS);

    expect(recibo.codigo).toBe('RC-0A1B2C3D4E5F');
    expect(recibo.sal).toBe(SAL);
  });

  it('hashRecibo = hasher(sal, payload canónico) e idOnchain = keccak256(uuid)', () => {
    const { caso, hasher } = crearCaso();

    const recibo = caso.ejecutar(DATOS);

    expect(hasher.hashRecibo).toHaveBeenCalledWith(recibo.payloadCanonico, SAL);
    expect(recibo.hashRecibo).toBe(HASH);
    expect(hasher.hashTexto).toHaveBeenCalledWith(recibo.id);
    expect(recibo.idOnchain).toBe(ID_ONCHAIN);
  });

  it('el payload canónico solo tiene datos del pago, sin datos personales (RN-06)', () => {
    const { caso } = crearCaso();

    const payload = JSON.parse(caso.ejecutar(DATOS).payloadCanonico) as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual(
      ['codigo', 'emitidoEn', 'fechaPago', 'moneda', 'monto', 'numeroPoliza', 'pagoId'].sort(),
    );
    for (const clave of [
      'nombres',
      'apellidos',
      'razonSocial',
      'identificacion',
      'email',
      'telefono',
    ]) {
      expect(payload).not.toHaveProperty(clave);
    }
  });

  it('serializa el payload en forma canónica (RFC 8785): claves ordenadas', () => {
    const { caso } = crearCaso();

    const { payloadCanonico } = caso.ejecutar(DATOS);

    expect(payloadCanonico).toBe(
      '{"codigo":"RC-0A1B2C3D4E5F","emitidoEn":"2026-10-24T15:00:00.000Z","fechaPago":"2026-10-24",' +
        '"moneda":"USD","monto":"120.13","numeroPoliza":"POL-2026-0001",' +
        '"pagoId":"22222222-2222-4222-8222-222222222222"}',
    );
  });
});
