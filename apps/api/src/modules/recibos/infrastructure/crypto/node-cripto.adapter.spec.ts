import { NodeCriptoAdapter } from './node-cripto.adapter';

describe('NodeCriptoAdapter (HU-22)', () => {
  const cripto = new NodeCriptoAdapter();

  it('genera códigos públicos RC- con 12 hexadecimales: al menos 10 caracteres (RN-12)', () => {
    const codigo = cripto.generarCodigo();
    expect(codigo).toMatch(/^RC-[0-9A-F]{12}$/);
    expect(codigo.length).toBeGreaterThanOrEqual(10);
  });

  it('genera una sal de 32 bytes distinta en cada emisión', () => {
    const a = cripto.generarSal();
    const b = cripto.generarSal();
    expect(a).toMatch(/^0x[0-9a-f]{64}$/);
    expect(b).toMatch(/^0x[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it('genera un uuid como id del recibo', () => {
    expect(cripto.generarId()).toMatch(/^[0-9a-f-]{36}$/);
  });
});
