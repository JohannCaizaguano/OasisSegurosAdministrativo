import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { reciboDetalle } from '../test-datos';
import { LineaTiempoAnclaje } from './LineaTiempoAnclaje';

afterEach(cleanup);

function pasos() {
  return within(screen.getByRole('list', { name: 'Línea de tiempo del anclaje' })).getAllByRole(
    'listitem',
  );
}

describe('LineaTiempoAnclaje (HU-24)', () => {
  it('un recibo anclado completa creado, enviado y anclado con fecha y hora de Ecuador', () => {
    render(<LineaTiempoAnclaje recibo={reciboDetalle()} />);
    const [creado, enviado, anclado] = pasos();
    expect(creado).toHaveTextContent('Creado');
    expect(creado).toHaveTextContent('20/10/2026');
    expect(enviado).toHaveTextContent('Enviado');
    expect(enviado).toHaveTextContent('Completado');
    expect(anclado).toHaveTextContent('Anclado');
    // 15:00:12 UTC son las 10:00 en Guayaquil.
    expect(anclado).toHaveTextContent(/20\/10\/2026.*10:00/);
    expect(anclado.querySelector('[data-tono="exito"]')).not.toBeNull();
  });

  it('un recibo enviado deja el anclaje en curso con el tono de proceso', () => {
    render(<LineaTiempoAnclaje recibo={reciboDetalle({ estado: 'ENVIADO', ancladoEn: null })} />);
    const anclado = pasos()[2];
    expect(anclado).toHaveTextContent('En curso');
    expect(anclado.querySelector('[data-tono="proceso"]')).not.toBeNull();
  });

  it('un recibo fallido cierra en error con el último error resumido', () => {
    render(
      <LineaTiempoAnclaje
        recibo={reciboDetalle({
          estado: 'FALLIDO',
          ancladoEn: null,
          intentos: 5,
          ultimoError: `RPC caído ${'x'.repeat(300)}`,
        })}
      />,
    );
    const final = pasos()[2];
    expect(final).toHaveTextContent('Fallido');
    expect(final).toHaveTextContent(/5 intentos/);
    expect(final).toHaveTextContent(/RPC caído/);
    expect(final.textContent?.length).toBeLessThan(260);
    expect(final.querySelector('[data-tono="error"]')).not.toBeNull();
  });

  it('enlaza la transacción en una pestaña nueva y segura', () => {
    render(<LineaTiempoAnclaje recibo={reciboDetalle()} />);
    const enlace = screen.getByRole('link', { name: /Ver transacción/ });
    expect(enlace).toHaveAttribute('href', reciboDetalle().explorerUrl);
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sin transacción no ofrece el enlace', () => {
    render(
      <LineaTiempoAnclaje
        recibo={reciboDetalle({
          estado: 'PENDIENTE_ANCLAJE',
          txHash: null,
          enviadoEn: null,
          ancladoEn: null,
          explorerUrl: null,
        })}
      />,
    );
    expect(screen.queryByRole('link', { name: /Ver transacción/ })).not.toBeInTheDocument();
    expect(pasos()[1]).toHaveTextContent('En curso');
    expect(pasos()[2]).toHaveTextContent('Pendiente');
  });
});
