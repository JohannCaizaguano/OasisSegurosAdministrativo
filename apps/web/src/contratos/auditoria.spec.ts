import { describe, expect, it } from 'vitest';

import { listarBitacoraQuerySchema } from '@oasis/shared';

const ID = '7b1e3c2a-4d5f-4a6b-8c9d-0e1f2a3b4c5d';

describe('listarBitacoraQuerySchema por entidad (HU-26, D10)', () => {
  it('filtra por entidad, id de la entidad y acción', () => {
    const resultado = listarBitacoraQuerySchema.safeParse({
      entidad: 'Recibo',
      entidadId: ID,
      accion: 'REINTENTAR',
      pageSize: '1',
    });
    expect(resultado.success && resultado.data).toEqual({
      entidad: 'Recibo',
      entidadId: ID,
      accion: 'REINTENTAR',
      page: 1,
      pageSize: 1,
    });
  });

  it('rechaza un id de entidad vacío, en su campo', () => {
    const resultado = listarBitacoraQuerySchema.safeParse({ entidadId: '  ' });
    expect(resultado.error?.issues.map((issue) => issue.path)).toEqual([['entidadId']]);
  });

  it('sin los filtros nuevos queda igual y conserva la regla de fechas', () => {
    const resultado = listarBitacoraQuerySchema.safeParse({});
    expect(resultado.success && resultado.data).toEqual({ page: 1, pageSize: 20 });
    expect(
      listarBitacoraQuerySchema.safeParse({ desde: '2026-11-10', hasta: '2026-11-01' }).error
        ?.issues[0]?.path,
    ).toEqual(['hasta']);
  });
});
