import type { Pago } from '@oasis/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SeguimientoPago } from './SeguimientoPago';

const BASE: Pago = {
  id: '7c1e5a90-2b3d-4f6a-9e8c-1d2b3a4c5d6e',
  polizaId: '3f2a1c8e-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
  numeroPoliza: 'POL-0001',
  monto: '120.50',
  fechaPago: '2026-10-20',
  metodo: 'DEBITO_BANCARIO',
  referencia: 'DB-0009',
  estado: 'REGISTRADO',
  createdAt: '2026-10-20T15:00:00.000Z',
  updatedAt: '2026-10-20T15:00:00.000Z',
};

afterEach(cleanup);

function pasos() {
  return within(screen.getByRole('list', { name: 'Seguimiento del pago' })).getAllByRole(
    'listitem',
  );
}

describe('SeguimientoPago', () => {
  it('un pago registrado deja «En revisión» como paso en curso', () => {
    render(<SeguimientoPago pago={BASE} />);
    const [registrado, revision, final] = pasos();
    expect(registrado).toHaveTextContent('Registrado');
    expect(registrado).toHaveTextContent('Completado');
    expect(registrado).toHaveTextContent('20/10/2026');
    expect(revision).toHaveTextContent('En revisión por Oasis Seguros');
    expect(revision).toHaveTextContent('En curso');
    expect(final).toHaveTextContent('Pendiente');
  });

  it('un pago validado muestra los tres pasos completos con su fecha', () => {
    render(
      <SeguimientoPago
        pago={{ ...BASE, estado: 'VALIDADO', validadoEn: '2026-10-21T15:00:00Z' }}
      />,
    );
    const lista = pasos();
    expect(lista).toHaveLength(3);
    lista.forEach((paso) => expect(paso).toHaveTextContent('Completado'));
    expect(lista[2]).toHaveTextContent('Validado · recibo verificable');
    expect(lista[2]).toHaveTextContent('21/10/2026');
  });

  it('un pago rechazado cierra en error con el motivo', () => {
    render(
      <SeguimientoPago
        pago={{
          ...BASE,
          estado: 'RECHAZADO',
          rechazadoEn: '2026-10-21T15:00:00Z',
          motivoRechazo: 'Referencia incorrecta',
        }}
      />,
    );
    const final = pasos()[2];
    expect(final).toHaveTextContent('Rechazado');
    expect(final).toHaveTextContent('21/10/2026');
    expect(final).toHaveTextContent('Referencia incorrecta');
    expect(final.querySelector('[data-tono="error"]')).not.toBeNull();
  });

  it('las fechas de los tres pasos salen solo como dd/mm/aaaa, sin hora', () => {
    render(
      <SeguimientoPago
        pago={{
          ...BASE,
          estado: 'RECHAZADO',
          rechazadoEn: '2026-10-21T15:00:00Z',
          motivoRechazo: 'x',
        }}
      />,
    );
    const lista = pasos();
    expect(lista[0]).toHaveTextContent(/Completado · 20\/10\/2026$/);
    expect(lista[2]).toHaveTextContent(/Rechazado · 21\/10\/2026/);
    expect(lista[0].textContent).not.toMatch(/\d{2}:\d{2}/);
    expect(lista[2].textContent).not.toMatch(/\d{2}:\d{2}/);
  });
});
