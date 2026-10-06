import type { RegistroBitacora, RespuestaPaginada } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BitacoraPage } from './BitacoraPage';
import { auditoriaApi } from '../api';

vi.mock('../api', () => ({
  auditoriaApi: {
    listar: vi.fn(),
    listarUsuarios: vi.fn(),
  },
}));

const listar = vi.mocked(auditoriaApi.listar);
const listarUsuarios = vi.mocked(auditoriaApi.listarUsuarios);

const REGISTRO: RegistroBitacora = {
  id: '11111111-1111-1111-1111-111111111111',
  usuarioId: '22222222-2222-2222-2222-222222222222',
  usuarioEmail: 'operador@oasis.com',
  accion: 'INICIAR_SESION',
  entidad: 'Usuario',
  entidadId: '22222222-2222-2222-2222-222222222222',
  ip: '10.0.0.1',
  detalle: { metodo: 'POST', ruta: '/api/v1/auth/login', requestId: 'req-1' },
  creadoEn: '2026-10-01T15:30:00.000Z',
};

function respuesta(
  items: RegistroBitacora[],
  meta: Partial<RespuestaPaginada<RegistroBitacora>['meta']> = {},
): RespuestaPaginada<RegistroBitacora> {
  return {
    data: items,
    meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1, ...meta },
  };
}

function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <BitacoraPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listarUsuarios.mockResolvedValue(
    respuesta([], { total: 0 }) as unknown as RespuestaPaginada<{
      id: string;
      email: string;
      rol: 'ADMIN' | 'OPERADOR' | 'CLIENTE';
    }>,
  );
});

afterEach(cleanup);

describe('BitacoraPage', () => {
  it('muestra cada registro con la acción en español y la hora de Ecuador', async () => {
    listar.mockResolvedValue(respuesta([REGISTRO]));
    montar();

    expect(await screen.findByText('Inicio de sesión')).toBeInTheDocument();
    expect(screen.getByText('operador@oasis.com')).toBeInTheDocument();
    expect(screen.getByText(/10:30:00/)).toBeInTheDocument();
  });

  it('al elegir una fecha desde vuelve a la página 1 y filtra', async () => {
    listar.mockResolvedValue(respuesta([REGISTRO], { total: 45, totalPages: 3 }));
    montar();

    await screen.findByText('Inicio de sesión');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    );

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });

    await waitFor(() =>
      expect(listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, desde: '2026-10-01' }),
      ),
    );
  });

  it('muestra el aviso cuando no hay registros', async () => {
    listar.mockResolvedValue(respuesta([]));
    montar();

    expect(await screen.findByText('No hay registros con estos filtros')).toBeInTheDocument();
  });
});
