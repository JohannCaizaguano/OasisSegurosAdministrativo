import { describe, expect, it } from 'vitest';

import { actualizarPolizaSchema, crearPolizaSchema, polizaSchema } from '@oasis/shared';

const ID = '7b1e3c2a-4d5f-4a6b-8c9d-0e1f2a3b4c5d';

const nueva = {
  numero: 'POL-2026-001',
  clienteId: ID,
  aseguradoraId: ID,
  ramoId: ID,
  primaTotal: '1500.50',
  fechaInicio: '2026-10-05',
  fechaFin: '2027-10-04',
};

describe('cobertura y condiciones de la póliza (HU-51, D17)', () => {
  it.each(['cobertura', 'condiciones'] as const)(
    '%s admite hasta 2 000 caracteres y recorta los espacios',
    (campo) => {
      const resultado = crearPolizaSchema.safeParse({
        ...nueva,
        [campo]: `  ${'a'.repeat(2000)}  `,
      });
      expect(resultado.success && resultado.data[campo]).toBe('a'.repeat(2000));
    },
  );

  it.each(['cobertura', 'condiciones'] as const)(
    '%s con 2 001 caracteres da error en su campo',
    (campo) => {
      const resultado = crearPolizaSchema.safeParse({ ...nueva, [campo]: 'a'.repeat(2001) });
      expect(resultado.error?.issues.map((issue) => issue.path)).toEqual([[campo]]);
      expect(
        actualizarPolizaSchema.safeParse({ [campo]: 'a'.repeat(2001) }).error?.issues[0]?.path,
      ).toEqual([campo]);
    },
  );

  it('vacía o solo con espacios queda sin definir', () => {
    const resultado = crearPolizaSchema.safeParse({ ...nueva, cobertura: '', condiciones: '   ' });
    expect(resultado.success).toBe(true);
    expect(resultado.data?.cobertura).toBeUndefined();
    expect(resultado.data?.condiciones).toBeUndefined();
  });

  it('al editar, vacía o solo con espacios pasa a null para borrar el texto', () => {
    const resultado = actualizarPolizaSchema.safeParse({ cobertura: '', condiciones: '   ' });
    expect(resultado.success && resultado.data).toEqual({ cobertura: null, condiciones: null });
  });

  it('al editar, un PATCH que solo borra la cobertura es válido', () => {
    expect(actualizarPolizaSchema.safeParse({ cobertura: '' }).success).toBe(true);
  });

  it('al editar, un texto se recorta y un campo ausente sigue ausente', () => {
    const resultado = actualizarPolizaSchema.safeParse({ condiciones: ' Deducible del 10 % ' });
    expect(resultado.success && resultado.data).toEqual({ condiciones: 'Deducible del 10 %' });
  });

  it('la respuesta trae ambos textos o null', () => {
    const respuesta = {
      ...nueva,
      id: ID,
      ramo: 'Vehículos',
      ramoCodigo: 'VEHICULOS',
      estado: 'VIGENTE',
      tienePagosValidados: false,
      enMora: false,
      createdAt: '2026-10-05T12:00:00.000Z',
      updatedAt: '2026-10-05T12:00:00.000Z',
    };
    expect(
      polizaSchema.safeParse({ ...respuesta, cobertura: 'Daños propios', condiciones: null })
        .success,
    ).toBe(true);
    expect(polizaSchema.safeParse(respuesta).success).toBe(false);
  });
});
