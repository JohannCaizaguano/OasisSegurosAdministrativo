import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import {
  cabecerasDeSesion,
  crearPolizaPropia,
  esperarCarga,
  hoyEnGuayaquil,
  iniciarSesion,
} from './ayudas';

/**
 * Etapa C (claridad de la interfaz): atajo del Panel a los pagos por validar, leyenda de estados
 * con el teclado y seguimiento de cada pago en el portal del CLIENTE.
 */
const OPERADOR = { email: 'operador@oasis.com', password: 'Operador.Oasis1' };
const CLIENTE = { email: 'cliente@oasis.com', password: 'Cliente.Oasis1' };

test('desde el Panel, «Revisar los pagos» abre Pagos filtrado por «Registrados»', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.18.0.1' });
  await iniciarSesion(page, OPERADOR.email, OPERADOR.password);
  await expect(page.getByTestId('cifra-por-validar')).toHaveText(/^\d+$/);

  await page.getByRole('link', { name: 'Revisar los pagos' }).click();

  await expect(page).toHaveURL(/\/pagos\?estado=REGISTRADO$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Pagos' })).toBeVisible();
  await expect(page.getByTestId('filtro-estado-pagos')).toHaveText('Registrados');
  await esperarCarga(page);
  const filas = page.locator('tbody tr');
  await expect(filas.first()).toBeVisible();
  const estados = await filas
    .locator('[data-estado]')
    .evaluateAll((nodos) => nodos.map((nodo) => nodo.getAttribute('data-estado')));
  expect(estados.length).toBeGreaterThan(0);
  expect(new Set(estados)).toEqual(new Set(['REGISTRADO']));
});

test('la leyenda de estados se abre con el teclado y muestra las descripciones', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.18.0.2' });
  await iniciarSesion(page, OPERADOR.email, OPERADOR.password);
  await page.goto('/pagos');
  await expect(page.getByRole('heading', { level: 1, name: 'Pagos' })).toBeVisible();

  const leyenda = page.getByTestId('leyenda-estados');
  await expect(leyenda).not.toHaveAttribute('open', '');
  await leyenda.locator('summary').focus();
  await expect(leyenda.locator('summary')).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(leyenda).toHaveAttribute('open', '');
  await expect(leyenda.getByText('¿Qué significa cada estado?')).toBeVisible();
  await expect(leyenda.locator('dd').first()).toBeVisible();
  await expect(leyenda.locator('dt [data-estado="VALIDADO"]')).toBeVisible();
  await expect(
    leyenda.getByText('El pago fue confirmado y tiene un recibo verificable.'),
  ).toBeVisible();
});

test('el portal del CLIENTE muestra el seguimiento de un pago por registrar, validar y rechazar', async ({
  page,
  request,
}) => {
  const ip = '10.18.0.3';
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });
  const cabeceras = await cabecerasDeSesion(request, ip, OPERADOR);
  const clientes = (await (
    await request.get('/api/v1/clientes?q=Cabrera&page=1&pageSize=1', { headers: cabeceras })
  ).json()) as { data: Array<{ id: string }> };
  const poliza = await crearPolizaPropia(request, cabeceras, {
    clienteId: clientes.data[0].id,
    prima: '300.00',
  });
  const motivo = `Referencia ilegible ${randomUUID().slice(0, 8)}`;

  const crear = async () => {
    const respuesta = await request.post('/api/v1/pagos', {
      headers: cabeceras,
      data: {
        polizaId: poliza.id,
        monto: '50.00',
        fechaPago: hoyEnGuayaquil(),
        metodo: 'DEBITO_BANCARIO',
        referencia: `DB-${randomUUID().slice(0, 8)}`,
      },
    });
    expect(respuesta.ok(), await respuesta.text()).toBeTruthy();
    return ((await respuesta.json()) as { id: string }).id;
  };
  await crear();
  const validado = await crear();
  const rechazado = await crear();
  const v = await request.patch(`/api/v1/pagos/${validado}/validar`, {
    headers: cabeceras,
    data: { confirmado: true },
  });
  expect(v.ok(), await v.text()).toBeTruthy();
  const r = await request.patch(`/api/v1/pagos/${rechazado}/rechazar`, {
    headers: cabeceras,
    data: { confirmado: true, motivo },
  });
  expect(r.ok(), await r.text()).toBeTruthy();

  await iniciarSesion(page, CLIENTE.email, CLIENTE.password);
  const tarjetas = page.locator('#pagos li', { hasText: poliza.numero });
  await expect(tarjetas).toHaveCount(3);
  for (const estado of ['REGISTRADO', 'VALIDADO', 'RECHAZADO']) {
    const tarjeta = tarjetas.filter({ has: page.locator(`[data-estado="${estado}"]`) });
    await expect(tarjeta).toHaveCount(1);
    const pasos = tarjeta.getByRole('list', { name: 'Seguimiento del pago' });
    await expect(pasos.getByRole('listitem')).toHaveCount(3);
    await expect(pasos).toContainText('Registrado');
    await expect(pasos).toContainText('En revisión por Oasis Seguros');
  }
  const pasosRechazado = tarjetas
    .filter({ has: page.locator('[data-estado="RECHAZADO"]') })
    .getByRole('list', { name: 'Seguimiento del pago' });
  await expect(pasosRechazado).toContainText(`Motivo del rechazo: ${motivo}`);
  await expect(pasosRechazado).toContainText(/Rechazado\s*Rechazado · \d{2}\/\d{2}\/\d{4}/);
});

const VIEWPORTS_AVATAR = [
  { nombre: 'riel de escritorio', ancho: 1280, alto: 800 },
  { nombre: 'riel de escritorio con altura baja', ancho: 1280, alto: 600 },
  { nombre: 'barra superior a 600 px', ancho: 600, alto: 900 },
  { nombre: 'barra superior a 360 px', ancho: 360, alto: 740 },
] as const;

VIEWPORTS_AVATAR.forEach((vista, indice) => {
  for (const [rol, cuenta] of [
    ['personal', OPERADOR],
    ['CLIENTE', CLIENTE],
  ] as const) {
    test(`el avatar de iniciales del ${rol} es un círculo de 44 × 44 px en ${vista.nombre} (${vista.ancho}×${vista.alto})`, async ({
      page,
    }) => {
      await page.setExtraHTTPHeaders({
        'X-Forwarded-For': `10.18.1.${indice * 2 + (rol === 'CLIENTE' ? 2 : 1)}`,
      });
      await page.setViewportSize({ width: vista.ancho, height: vista.alto });
      await iniciarSesion(page, cuenta.email, cuenta.password);

      const caja = await page.getByTestId('menu-usuario').boundingBox();

      expect(caja).not.toBeNull();
      expect(Math.abs((caja?.width ?? 0) - 44)).toBeLessThanOrEqual(0.5);
      expect(Math.abs((caja?.height ?? 0) - 44)).toBeLessThanOrEqual(0.5);
    });
  }
});
