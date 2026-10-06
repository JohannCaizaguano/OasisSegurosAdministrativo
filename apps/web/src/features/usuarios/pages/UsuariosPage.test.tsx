import type { RespuestaPaginada, Usuario } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

import { UsuariosPage } from './UsuariosPage';
import { usuariosApi } from '../api';

vi.mock('../api', () => ({
  usuariosApi: {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    desactivar: vi.fn(),
    reactivar: vi.fn(),
    restablecerContrasena: vi.fn(),
  },
}));

const listar = vi.mocked(usuariosApi.listar);
const crear = vi.mocked(usuariosApi.crear);
const desactivar = vi.mocked(usuariosApi.desactivar);

const ADMIN_ID = '11111111-1111-1111-1111-111111111111';
const OPERADOR_ID = '22222222-2222-2222-2222-222222222222';

const ADMIN: Usuario = {
  id: ADMIN_ID,
  email: 'admin@oasis.com',
  nombre: 'Administrador Oasis',
  rol: 'ADMIN',
  activo: true,
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
};

const OPERADOR: Usuario = {
  id: OPERADOR_ID,
  email: 'operador@oasis.com',
  nombre: 'Operador Oasis',
  rol: 'OPERADOR',
  activo: true,
  createdAt: '2026-10-02T12:00:00.000Z',
  updatedAt: '2026-10-02T12:00:00.000Z',
};

function respuesta(items: Usuario[]): RespuestaPaginada<Usuario> {
  return {
    data: items,
    meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
  };
}

function montar() {
  useAuthStore.setState({
    accessToken: 'token',
    autenticado: true,
    usuario: {
      id: ADMIN_ID,
      email: 'admin@oasis.com',
      rol: 'ADMIN',
      nombre: 'Administrador Oasis',
      clienteId: null,
    },
  });
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <UsuariosPage />
    </QueryClientProvider>,
  );
}

function abrirMenu(usuarioId: string) {
  const boton = screen.getByTestId(`menu-usuario-${usuarioId}`);
  fireEvent.pointerDown(boton, { button: 0 });
  fireEvent.click(boton);
}

function llenarNuevoUsuario(email: string) {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo Operador' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: email } });
}

beforeEach(() => {
  vi.clearAllMocks();
  listar.mockResolvedValue(respuesta([ADMIN, OPERADOR]));
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

describe('UsuariosPage', () => {
  it('lista usuarios del personal con su estado', async () => {
    montar();

    expect(await screen.findByText('Operador Oasis')).toBeInTheDocument();
    expect(screen.getByText('admin@oasis.com')).toBeInTheDocument();
    expect(screen.getAllByText('Activo')).toHaveLength(2);
  });

  it('muestra la contraseña temporal una sola vez tras crear', async () => {
    listar.mockResolvedValue(respuesta([]));
    crear.mockResolvedValue({ usuario: OPERADOR, contrasenaTemporal: 'Temporal.123' });
    montar();

    fireEvent.click(screen.getByTestId('boton-nuevo-usuario'));
    llenarNuevoUsuario('nuevo@oasis.com');
    fireEvent.click(screen.getByTestId('boton-guardar-usuario'));

    expect(await screen.findByText('Temporal.123')).toBeInTheDocument();
    expect(screen.getByText('Esta contraseña no se volverá a mostrar.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    await waitFor(() => expect(screen.queryByText('Temporal.123')).not.toBeInTheDocument());
  });

  it('muestra el error de correo duplicado en el campo', async () => {
    listar.mockResolvedValue(respuesta([]));
    crear.mockRejectedValue(
      new ApiError(
        {
          statusCode: 409,
          code: 'CONFLICTO',
          message: 'Ya existe un usuario con ese correo',
          details: { campo: 'email', motivo: 'CORREO_DUPLICADO' },
        },
        409,
      ),
    );
    montar();

    fireEvent.click(screen.getByTestId('boton-nuevo-usuario'));
    llenarNuevoUsuario('admin@oasis.com');
    fireEvent.click(screen.getByTestId('boton-guardar-usuario'));

    expect(await screen.findByText('Ya existe un usuario con ese correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
  });

  it('pide confirmación antes de desactivar', async () => {
    montar();
    await screen.findByText('Operador Oasis');

    abrirMenu(OPERADOR_ID);
    fireEvent.click(await screen.findByText('Desactivar'));

    expect(await screen.findByText(/Se cerrarán todas sus sesiones/)).toBeInTheDocument();
    expect(desactivar).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('confirmar-accion'));
    await waitFor(() => expect(desactivar).toHaveBeenCalledWith(OPERADOR_ID));
  });

  it('no ofrece desactivarse a uno mismo', async () => {
    montar();
    await screen.findByText('Administrador Oasis');

    abrirMenu(ADMIN_ID);
    await screen.findByText('Editar');

    expect(screen.queryByText('Desactivar')).not.toBeInTheDocument();
    expect(screen.queryByText('Restablecer contraseña')).not.toBeInTheDocument();
  });
});
