import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api-client';

import { recibosApi } from './api';

vi.mock('@/lib/api-client', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const ID = '9b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';

afterEach(() => vi.clearAllMocks());

describe('recibosApi.ultimoReintento (D10)', () => {
  it('pide a la bitácora el último REINTENTAR de ese recibo y devuelve el primer registro', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 'b1',
          usuarioId: 'u1',
          usuarioEmail: 'admin@oasis.com',
          accion: 'REINTENTAR',
          entidad: 'Recibo',
          entidadId: 'otro-valor-que-el-api-ya-filtro',
          ip: null,
          detalle: null,
          creadoEn: '2026-10-21T15:30:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 1, total: 1, totalPages: 1 },
    });

    const ultimo = await recibosApi.ultimoReintento(ID);

    const ruta = vi.mocked(api.get).mock.calls[0]?.[0] ?? '';
    const [camino, query] = ruta.split('?');
    expect(camino).toBe('/bitacora');
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({
      page: '1',
      pageSize: '1',
      accion: 'REINTENTAR',
      entidad: 'Recibo',
      entidadId: ID,
    });
    expect(ultimo).toEqual({
      usuarioEmail: 'admin@oasis.com',
      creadoEn: '2026-10-21T15:30:00.000Z',
    });
  });

  it('sin reintentos devuelve null', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 1, total: 0, totalPages: 0 },
    });
    expect(await recibosApi.ultimoReintento(ID)).toBeNull();
  });
});
