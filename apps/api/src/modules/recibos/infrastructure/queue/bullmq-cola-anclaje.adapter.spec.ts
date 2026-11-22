import type { Queue } from 'bullmq';

import { BullMqColaAnclajeAdapter } from './bullmq-cola-anclaje.adapter';

const RECIBO_ID = '11111111-1111-1111-1111-111111111111';

describe('BullMqColaAnclajeAdapter', () => {
  it('ningún jobId lleva «:», que BullMQ 6 rechaza en los ids propios', async () => {
    const cola = { add: jest.fn().mockResolvedValue({}) };
    const adaptador = new BullMqColaAnclajeAdapter(cola as unknown as Queue);

    await adaptador.encolarAnclaje(RECIBO_ID);
    await adaptador.encolarAnulacion(RECIBO_ID);

    const ids = cola.add.mock.calls.map(([, , opciones]) => (opciones as { jobId: string }).jobId);
    expect(ids).toEqual([RECIBO_ID, `anular-${RECIBO_ID}`]);
    for (const id of ids) expect(id).not.toContain(':');
  });
});
