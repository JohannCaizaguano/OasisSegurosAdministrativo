import type { VerificacionRecibo } from '@oasis/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ESTADOS } from '@/components/estados';

import { verificacionApi } from '../api';
import { VerificacionPage } from './VerificacionPage';

vi.mock('../api', () => ({ verificacionApi: { obtener: vi.fn() } }));

afterEach(cleanup);

function verificacion(estado: VerificacionRecibo['estado']): VerificacionRecibo {
  return {
    codigo: 'RC-0123456789AB',
    estado,
    hashRecibo: `0x${'a'.repeat(64)}`,
    hashOnchain: null,
    txHash: null,
    chainId: 31337,
    verificadoEn: '2026-10-20T10:00:00.000Z',
  };
}

describe('VerificacionPage', () => {
  it.each(Object.keys(ESTADOS.verificacion) as Array<VerificacionRecibo['estado']>)(
    'explica el resultado %s en lenguaje llano, sin hash ni blockchain',
    async (estado) => {
      vi.mocked(verificacionApi.obtener).mockResolvedValue(verificacion(estado));
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={['/recibos/verificar/RC-0123456789AB']}>
            <Routes>
              <Route path="/recibos/verificar/:codigo" element={<VerificacionPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      const resultado = await screen.findByTestId('resultado-verificacion');
      const descripcion = ESTADOS.verificacion[estado].descripcion;
      expect(screen.getByText(descripcion)).toBeInTheDocument();
      expect(descripcion).not.toMatch(/hash|blockchain|cadena/i);
      expect(resultado.querySelector('h2')).not.toHaveTextContent(/hash|blockchain/i);
    },
  );
});
