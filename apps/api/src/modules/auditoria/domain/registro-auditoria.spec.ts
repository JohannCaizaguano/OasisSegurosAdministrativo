import { construirDetalle } from './registro-auditoria';

const PETICION = { metodo: 'PATCH', ruta: '/api/v1/clientes/:id', requestId: 'req-1' };

describe('construirDetalle', () => {
  it('en MODIFICAR guarda los nombres de los campos ordenados', () => {
    const detalle = construirDetalle('MODIFICAR', {
      ...PETICION,
      cuerpo: { telefono: '0991234567', nombres: 'Ana' },
    });

    expect(detalle.campos).toEqual(['nombres', 'telefono']);
  });

  it('no guarda los valores del cuerpo', () => {
    const detalle = construirDetalle('MODIFICAR', {
      ...PETICION,
      cuerpo: { telefono: '0991234567' },
    });

    expect(JSON.stringify(detalle)).not.toContain('0991234567');
  });

  it('en otras acciones no agrega campos', () => {
    const detalle = construirDetalle('CREAR', { ...PETICION, cuerpo: { nombres: 'Ana' } });

    expect(detalle.campos).toBeUndefined();
  });

  it('un cuerpo vacío o no objeto no agrega campos', () => {
    expect(construirDetalle('MODIFICAR', { ...PETICION, cuerpo: {} }).campos).toBeUndefined();
    expect(construirDetalle('MODIFICAR', { ...PETICION, cuerpo: null }).campos).toBeUndefined();
    expect(construirDetalle('MODIFICAR', { ...PETICION, cuerpo: 'texto' }).campos).toBeUndefined();
  });
});
