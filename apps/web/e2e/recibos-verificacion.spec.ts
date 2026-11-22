import { randomUUID } from 'node:crypto';

import { expect, test, type APIRequestContext } from '@playwright/test';

import { cabecerasDeSesion, crearPolizaPropia, hoyEnGuayaquil, iniciarSesion } from './ayudas';

/**
 * HU-24 (estado del anclaje con sondeo), HU-25 (imprimible con QR y estilos de impresión) y HU-28
 * (verificación con sesión, también para el CLIENTE, con RN-07) de punta a punta.
 */
const OPERADOR = { email: 'operador@oasis.com', password: 'Operador.Oasis1' };
const CLIENTE = { email: 'cliente@oasis.com', password: 'Cliente.Oasis1' };

interface ReciboEmitido {
  id: string;
  codigo: string;
}

/** Recibo nuevo sobre una póliza propia (D22); con `clienteId`, del cliente indicado. */
async function emitirRecibo(
  request: APIRequestContext,
  headers: Record<string, string>,
  clienteId?: string,
): Promise<ReciboEmitido> {
  const { id: polizaId } = await crearPolizaPropia(request, headers, { clienteId });
  const pago = await request.post('/api/v1/pagos', {
    headers,
    data: {
      polizaId,
      monto: '25.40',
      fechaPago: hoyEnGuayaquil(),
      metodo: 'TRANSFERENCIA',
      referencia: `E2E-RECIBO-${randomUUID()}`,
    },
  });
  expect(pago.ok(), await pago.text()).toBeTruthy();
  const validado = await request.patch(
    `/api/v1/pagos/${((await pago.json()) as { id: string }).id}/validar`,
    { headers, data: { confirmado: true } },
  );
  expect(validado.ok(), await validado.text()).toBeTruthy();
  const { recibo } = (await validado.json()) as { recibo: ReciboEmitido };
  return { id: recibo.id, codigo: recibo.codigo };
}

async function esperarAnclado(
  request: APIRequestContext,
  headers: Record<string, string>,
  reciboId: string,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const respuesta = await request.get(`/api/v1/recibos/${reciboId}`, { headers });
        return ((await respuesta.json()) as { estado: string }).estado;
      },
      { timeout: 90_000, intervals: [500, 1_000] },
    )
    .toBe('ANCLADO');
}

/** `clienteId` del cliente del seed, leído de sus propias pólizas. */
async function clienteDelSeed(request: APIRequestContext, ip: string): Promise<string> {
  const headers = await cabecerasDeSesion(request, ip, CLIENTE);
  const respuesta = await request.get('/api/v1/mis-polizas?page=1&pageSize=1', { headers });
  const { data } = (await respuesta.json()) as { data: Array<{ clienteId: string }> };
  return data[0].clienteId;
}

test('el operador ve «En proceso» pasar a «Verificable» sin recargar, y abre e imprime el recibo (HU-24, HU-25)', async ({
  page,
  request,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.24.0.1' });
  const cabeceras = await cabecerasDeSesion(request, '10.24.1.1', OPERADOR);
  const clienteId = await clienteDelSeed(request, '10.24.1.2');
  const recibo = await emitirRecibo(request, cabeceras, clienteId);

  // El worker ancla en milisegundos: la primera lectura del detalle se sirve como la devolvió la
  // validación (PENDIENTE_ANCLAJE) para observar el sondeo de 10 s (D9) hasta el estado real.
  let primeraLectura = true;
  await page.route(`**/api/v1/recibos/${recibo.id}`, async (ruta) => {
    const respuesta = await ruta.fetch();
    if (!primeraLectura) return ruta.fulfill({ response: respuesta });
    primeraLectura = false;
    const cuerpo = (await respuesta.json()) as Record<string, unknown>;
    return ruta.fulfill({
      response: respuesta,
      json: {
        ...cuerpo,
        estado: 'PENDIENTE_ANCLAJE',
        txHash: null,
        blockNumber: null,
        enviadoEn: null,
        ancladoEn: null,
        explorerUrl: null,
      },
    });
  });

  await iniciarSesion(page, OPERADOR.email, OPERADOR.password);
  await page.goto(`/recibos/${recibo.id}`);
  // Una recarga borraría esta marca: así se comprueba que el cambio llega por el sondeo.
  await page.evaluate(() => {
    (window as Window & { sinRecargar?: boolean }).sinRecargar = true;
  });
  const estado = page.getByTestId('estado-recibo');
  await expect(estado).toHaveText('En proceso');

  await expect(estado).toHaveAttribute('data-estado', 'ANCLADO', { timeout: 25_000 });
  await expect(estado).toHaveText('Verificable');
  expect(
    await page.evaluate(() => (window as Window & { sinRecargar?: boolean }).sinRecargar),
    'el estado cambia sin recargar la página',
  ).toBe(true);
  await expect(page.getByRole('list', { name: 'Línea de tiempo del anclaje' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver transacción' })).toHaveAttribute(
    'href',
    /\/tx\/0x[0-9a-f]{64}$/,
  );

  await page.getByRole('link', { name: 'Imprimir' }).click();
  await expect(page).toHaveURL(new RegExp(`/recibos/${recibo.id}/imprimir$`));
  const hoja = page.getByRole('article', { name: 'Recibo de pago' });
  await expect(hoja).toBeVisible();
  await expect(hoja).toContainText(recibo.codigo);
  await expect(hoja).toContainText('******4065');
  await expect(hoja).not.toContainText('1710034065');
  await expect(hoja.locator('[data-estado]')).toHaveAttribute('data-estado', 'ANCLADO');
  await expect(hoja.locator('svg title')).toHaveText(
    `Código QR para verificar el recibo ${recibo.codigo}`,
  );

  await page.evaluate(() => {
    const ventana = window as Window & { impresiones?: number };
    ventana.impresiones = 0;
    window.print = () => {
      ventana.impresiones = (ventana.impresiones ?? 0) + 1;
    };
  });
  await page.getByRole('button', { name: 'Imprimir o guardar PDF' }).click();
  expect(await page.evaluate(() => (window as Window & { impresiones?: number }).impresiones)).toBe(
    1,
  );

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-no-imprimir]')).toBeHidden();
  for (const barra of await page.locator('[data-barra]').all()) {
    await expect(barra).toBeHidden();
  }
  await expect(hoja).toBeVisible();
});

test('el CLIENTE abre el QR sin sesión, inicia sesión y ve «Auténtico»; un recibo ajeno sale «No encontrado» (HU-28, RN-07)', async ({
  page,
  request,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.28.0.1' });
  const cabeceras = await cabecerasDeSesion(request, '10.28.1.1', OPERADOR);
  const clienteId = await clienteDelSeed(request, '10.28.1.2');
  const propio = await emitirRecibo(request, cabeceras, clienteId);
  const ajeno = await emitirRecibo(request, cabeceras);
  await esperarAnclado(request, cabeceras, propio.id);
  await esperarAnclado(request, cabeceras, ajeno.id);

  await page.goto(`/recibos/verificar/${propio.codigo}`);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Correo electrónico').fill(CLIENTE.email);
  await page.getByLabel('Contraseña').fill(CLIENTE.password);
  await page.getByTestId('boton-login').click();

  await expect(page).toHaveURL(new RegExp(`/recibos/verificar/${propio.codigo}$`));
  const resultado = page.getByTestId('resultado-verificacion');
  await expect(resultado).toHaveAttribute('data-estado', 'AUTENTICO', { timeout: 30_000 });
  await expect(resultado).toContainText('Auténtico');
  await expect(resultado).toContainText(propio.codigo);
  // D5: el cliente no ve hashes ni el contrato, solo el registro público.
  await expect(page.getByTestId('hash-verificado')).toHaveCount(0);
  await expect(page.getByText(/hash|blockchain/i)).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver el registro público' })).toHaveAttribute(
    'href',
    /\/tx\/0x[0-9a-f]{64}$/,
  );

  await page.goto(`/recibos/verificar/${ajeno.codigo}`);
  await expect(page.getByTestId('resultado-verificacion')).toHaveAttribute(
    'data-estado',
    'NO_ENCONTRADO',
  );
  await expect(page.getByTestId('resultado-verificacion')).toContainText('No encontrado');
});

test('el CLIENTE abre su recibo imprimible desde el portal; uno ajeno no se muestra (HU-25, D7)', async ({
  page,
  request,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.25.0.1' });
  const cabeceras = await cabecerasDeSesion(request, '10.25.1.1', OPERADOR);
  const clienteId = await clienteDelSeed(request, '10.25.1.2');
  const propio = await emitirRecibo(request, cabeceras, clienteId);
  const ajeno = await emitirRecibo(request, cabeceras);

  await iniciarSesion(page, CLIENTE.email, CLIENTE.password);
  await page.goto(`/portal/recibos/${propio.id}`);

  const hoja = page.getByRole('article', { name: 'Recibo de pago' });
  await expect(hoja).toBeVisible();
  await expect(hoja).toContainText(propio.codigo);
  await expect(hoja).toContainText('******4065');
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();

  await page.goto(`/portal/recibos/${ajeno.id}`);
  await expect(page.getByRole('article', { name: 'Recibo de pago' })).toHaveCount(0);
  await expect(page.getByText(ajeno.codigo)).toHaveCount(0);
});
