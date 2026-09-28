import { expect, test } from '@playwright/test';

/**
 * Flujo completo desde la SPA:
 *   login (OPERADOR) -> validar un pago -> recibo ANCLADO -> detalle con QR ->
 *   verificación pública sin sesión (se cierra sesión antes).
 *
 * Requisitos: postgres, redis, nodo Hardhat, contrato desplegado, API, worker
 * y Vite dev server en marcha (pnpm dev).
 */
test('flujo completo de validación, anclaje y verificación pública', async ({ page, request }) => {
  // 0. Preparación por API: asegurar un pago REGISTRADO que validar en la UI.
  const loginApi = await request.post('/api/v1/auth/login', {
    data: { email: 'operador@oasis.com', password: 'Operador.Oasis1' },
  });
  expect(loginApi.ok()).toBeTruthy();
  const { accessToken } = (await loginApi.json()) as { accessToken: string };
  const cabeceras = { Authorization: `Bearer ${accessToken}` };

  const polizas = (await (
    await request.get('/api/v1/polizas?page=1&pageSize=1', { headers: cabeceras })
  ).json()) as {
    data: Array<{ id: string }>;
  };
  expect(polizas.data.length).toBeGreaterThan(0);

  const crearPago = await request.post('/api/v1/pagos', {
    headers: cabeceras,
    data: {
      polizaId: polizas.data[0].id,
      monto: '19.75',
      fechaPago: new Date().toISOString().slice(0, 10),
      metodo: 'TRANSFERENCIA',
      referencia: `E2E-WEB-${Date.now()}`,
    },
  });
  expect(crearPago.ok()).toBeTruthy();

  // 1. Login
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('operador@oasis.com');
  await page.getByLabel('Contraseña').fill('Operador.Oasis1');
  await page.getByTestId('boton-login').click();
  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();

  // 2. Validar el primer pago REGISTRADO
  await page.getByRole('link', { name: 'Pagos', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Pagos', exact: true })).toBeVisible();

  const botonValidar = page.locator('[data-testid^="boton-validar-"]').first();
  await expect(botonValidar).toBeVisible({ timeout: 15_000 });
  await botonValidar.click();

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

  // 5. Cerrar sesión y verificar como público (sin login)
  await page.getByTestId('menu-usuario').click();
  await page.getByTestId('boton-logout').click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto(`/verificar/${codigo}`);
  await expect(page.getByTestId('resultado-verificacion')).toBeVisible();
  await expect(page.getByTestId('resultado-verificacion')).toContainText('VALIDO');
  await expect(page.getByTestId('resultado-verificacion')).toContainText(codigo as string);

  const hashVerificado = (await page.getByTestId('hash-verificado').textContent())?.trim();
  expect(hashVerificado).toBe(hash);
});
