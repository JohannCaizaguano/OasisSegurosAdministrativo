import type { Rol, VerificacionRecibo } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ESTADOS } from '@/components/estados';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

import { verificacionApi } from '../api';
import { VerificacionPage } from './VerificacionPage';

vi.mock('../api', () => ({ verificacionApi: { obtener: vi.fn() } }));

const HASH = `0x${'a'.repeat(64)}`;

function verificacion(
  estado: VerificacionRecibo['estado'],
  cambios: Partial<VerificacionRecibo> = {},
): VerificacionRecibo {
  return {
    codigo: 'RC-0123456789AB',
    estado,
    hashRecibo: HASH,
    hashOnchain: HASH,
    txHash: `0x${'b'.repeat(64)}`,
    blockNumber: '120',
    ancladoEn: '2026-10-20T15:00:12.000Z',
    chainId: 80002,
    contractAddress: `0x${'c'.repeat(40)}`,
    explorerUrl: `https://amoy.polygonscan.com/tx/0x${'b'.repeat(64)}`,
    verificadoEn: '2026-10-20T16:00:00.000Z',
    ...cambios,
  };
}

function montar(rol: Rol) {
  useAuthStore.setState({
    accessToken: 't',
    autenticado: true,
    usuario: { id: 'u1', email: 'x@oasis.com', nombre: 'X', rol },
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/recibos/verificar/RC-0123456789AB']}>
        <Routes>
          <Route path="/recibos/verificar/:codigo" element={<VerificacionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

afterEach(() => {
  cleanup();
  useAuthStore.setState({ accessToken: null, usuario: null, autenticado: false });
});

const TITULOS: Record<VerificacionRecibo['estado'], string> = {
  AUTENTICO: 'Recibo auténtico',
  NO_COINCIDE: 'El recibo no coincide',
  EN_PROCESO: 'Recibo en proceso',
  ANULADO: 'Recibo anulado',
  NO_ENCONTRADO: 'Recibo no encontrado',
};

describe('VerificacionPage (HU-28)', () => {
  it.each(Object.keys(ESTADOS.verificacion) as Array<VerificacionRecibo['estado']>)(
    'explica el resultado %s con su insignia, en lenguaje llano',
    async (estado) => {
      vi.mocked(verificacionApi.obtener).mockResolvedValue(verificacion(estado));
      montar('CLIENTE');

      const resultado = await screen.findByTestId('resultado-verificacion');
      expect(resultado).toHaveAttribute('data-estado', estado);
      expect(screen.getByRole('heading', { name: TITULOS[estado] })).toBeInTheDocument();
      const descripcion = ESTADOS.verificacion[estado].descripcion;
      expect(screen.getByText(descripcion)).toBeInTheDocument();
      expect(descripcion).not.toMatch(/hash|blockchain|cadena/i);
      expect(resultado.querySelector(`[data-estado="${estado}"][data-tono]`)).not.toBeNull();
    },
  );

  it('el CLIENTE no ve hashes, contrato ni «Detalles técnicos»', async () => {
    vi.mocked(verificacionApi.obtener).mockResolvedValue(
      verificacion('AUTENTICO', { hashOnchain: undefined, contractAddress: undefined }),
    );
    montar('CLIENTE');

    const resultado = await screen.findByTestId('resultado-verificacion');
    expect(resultado.textContent).not.toMatch(/0x[0-9a-f]{6}|hash|blockchain|contrato/i);
    expect(screen.queryByText('Detalles técnicos')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver el registro público/ })).toHaveAttribute(
      'href',
      verificacion('AUTENTICO').explorerUrl,
    );
  });

  it('el personal ve los hashes en «Detalles técnicos», plegado por defecto', async () => {
    vi.mocked(verificacionApi.obtener).mockResolvedValue(verificacion('AUTENTICO'));
    montar('OPERADOR');

    const resumen = await screen.findByText('Detalles técnicos');
    const detalles = resumen.closest('details');
    expect(detalles).not.toBeNull();
    expect(detalles).not.toHaveAttribute('open');
    expect(detalles).toHaveTextContent(HASH);
    expect(detalles).toHaveTextContent(`0x${'c'.repeat(40)}`);
    expect(screen.getByRole('link', { name: /Ver en el explorador/ })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('con 429 pide esperar y dice cuántos segundos faltan', async () => {
    vi.mocked(verificacionApi.obtener).mockRejectedValue(
      new ApiError(
        {
          statusCode: 429,
          code: 'DEMASIADAS_CONSULTAS',
          message: 'Demasiadas consultas',
          details: { motivo: 'DEMASIADAS_CONSULTAS', reintentarEnSegundos: 42 },
        },
        429,
      ),
    );
    montar('CLIENTE');

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/^Demasiadas consultas; intente de nuevo en 42 segundos\.$/);
    expect(alerta).not.toHaveTextContent(/minuto/);
  });
});
