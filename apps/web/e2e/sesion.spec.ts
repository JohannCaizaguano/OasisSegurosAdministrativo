import { expect, test } from '@playwright/test';

import { iniciarSesion } from './ayudas';

/**
 * E2E de sesión: "atrás" tras cerrar sesión (HU-02) e inactividad con reloj
 * falso (HU-32). Requiere la pila completa (ver README).
 */
const EMAIL = process.env.E2E_EMAIL ?? 'operador@oasis.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'Operador.Oasis1';

test('volver atrás después de cerrar sesión no muestra datos protegidos', async ({ page }) => {
  // IP propia de la prueba: el límite de 5 inicios/min por IP no cruza pruebas (D25).
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.3.0.11' });
  await iniciarSesion(page, EMAIL, PASSWORD);

  await page.getByRole('link', { name: 'Pagos', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Pagos', exact: true })).toBeVisible();

  await page.getByTestId('menu-usuario').click();
  await page.getByTestId('boton-logout').click();
  await expect(page).toHaveURL(/\/login/);

  await page.goBack();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/Hola,/)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Pagos', exact: true })).toHaveCount(0);
});

test('avisa a los 29 minutos sin actividad y cierra la sesión a los 30', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.3.0.12' });
  await page.clock.install();
  await iniciarSesion(page, EMAIL, PASSWORD);

  await page.clock.fastForward('29:00');
  const dialogo = page.getByRole('alertdialog');
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toContainText('se cerrará por inactividad');

  await page.clock.fastForward('01:00');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByTestId('aviso-cierre')).toHaveText('Su sesión se cerró por inactividad.');
});

test('Continuar mantiene la sesión', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.3.0.13' });
  await page.clock.install();
  await iniciarSesion(page, EMAIL, PASSWORD);

  await page.clock.fastForward('29:00');
  const dialogo = page.getByRole('alertdialog');
  await expect(dialogo).toBeVisible();

  await dialogo.getByRole('button', { name: 'Continuar' }).click();
  await expect(dialogo).toBeHidden();

  await page.clock.fastForward('01:00');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();
});
