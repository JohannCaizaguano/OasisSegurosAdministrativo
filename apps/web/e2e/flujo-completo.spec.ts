import { expect, test } from '@playwright/test';

/**
 * E2E de la SPA: login → validar pago → ANCLADO → QR → verificación con sesión;
 * requiere la pila completa (ver README).
 */
const EMAIL = process.env.E2E_EMAIL ?? 'operador@oasis.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'Operador.Oasis1';
// IP propia de la prueba: el límite de 5 inicios/min por IP no cruza pruebas (D25).
const IP = '10.3.0.1';

test('flujo completo de validación, anclaje y verificación con sesión', async ({
  page,
  request,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': IP });

  // 0. Preparación por API: asegurar un pago REGISTRADO que validar en la UI.
  const loginApi = await request.post('/api/v1/auth/login', {
    headers: { 'X-Forwarded-For': IP },
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(loginApi.ok()).toBeTruthy();
  const { accessToken } = (await loginApi.json()) as { accessToken: string };
  const cabeceras = { Authorization: `Bearer ${accessToken}`, 'X-Forwarded-For': IP };

  const polizas = (await (
    await request.get('/api/v1/polizas?page=1&pageSize=1', { headers: cabeceras })
  ).json()) as {
    data: Array<{ id: string }>;
  };
  expect(polizas.data.length).toBeGreaterThan(0);

  // Referencia única por ejecución para localizar la fila en la UI.
  const referencia = `E2E-WEB-${Date.now()}`;
  const crearPago = await request.post('/api/v1/pagos', {
    headers: cabeceras,
    data: {
      polizaId: polizas.data[0].id,
      monto: '19.75',
      fechaPago: new Date().toISOString().slice(0, 10),
      metodo: 'TRANSFERENCIA',
      referencia,
    },
  });
  expect(crearPago.ok()).toBeTruthy();

  // 1. Login
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(EMAIL);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByTestId('boton-login').click();
  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();

  // 2. Validar el primer pago REGISTRADO
  await page.getByRole('link', { name: 'Pagos', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Pagos', exact: true })).toBeVisible();

  // Se localiza la fila por su referencia para no validar otro pago.
  await page.getByLabel('Filtrar por estado').click();
  await page.getByRole('option', { name: 'Registrados' }).click();
  const filaPago = page.locator('tbody tr', { hasText: referencia });
  await expect(filaPago).toBeVisible({ timeout: 15_000 });

  await filaPago.getByRole('button', { name: 'Validar' }).click();

  // Confirmación explícita: la acción es irreversible.
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await dialogo.getByLabel(/confirmo que revisé/i).check();
  await dialogo.getByTestId('confirmar-validar').click();

  const toast = page.getByText(/Recibo RC-[A-Z0-9]+/).first();
  await expect(toast).toBeVisible();
  const codigo = /RC-[A-Z0-9]+/.exec((await toast.textContent()) ?? '')?.[0];
  expect(codigo, 'el toast debe incluir el código del recibo').toBeTruthy();

  // 3. Esperar el anclaje del recibo recién emitido en la pantalla de recibos
  await page.getByRole('link', { name: 'Recibos', exact: true }).click();
  const fila = page.locator('tbody tr', { hasText: codigo as string });
  await expect(fila).toContainText('ANCLADO', { timeout: 90_000 });

  // 4. Detalle del recibo con QR
  await fila.getByRole('link', { name: 'Ver detalle' }).click();
  await expect(page.getByTestId('estado-recibo')).toHaveText('ANCLADO');
  await expect(page.getByTestId('qr-recibo')).toBeVisible();
  await expect(page.getByTestId('fecha-anclado')).not.toHaveText('—');

  const hash = (await page.getByTestId('hash-recibo').textContent())?.trim();
  expect(hash).toMatch(/^0x[0-9a-f]{64}$/);

  // 5. Cerrar sesión, abrir el QR sin sesión y verificar tras iniciar sesión
  await page.getByTestId('menu-usuario').click();
  await page.getByTestId('boton-logout').click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto(`/recibos/verificar/${codigo}`);
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel('Correo electrónico').fill(EMAIL);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByTestId('boton-login').click();

  await expect(page.getByTestId('resultado-verificacion')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('resultado-verificacion')).toContainText('VALIDO');
  await expect(page.getByTestId('resultado-verificacion')).toContainText(codigo as string);

  const hashVerificado = (await page.getByTestId('hash-verificado').textContent())?.trim();
  expect(hashVerificado).toBe(hash);
});
