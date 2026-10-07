import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Login de la SPA por la interfaz; compartido por los e2e de la web. */
export async function iniciarSesion(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByTestId('boton-login').click();
  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();
}

/** Espera a que la página deje de mostrar esqueletos de carga. */
export async function esperarCarga(page: Page): Promise<void> {
  await expect(page.locator('main .animate-pulse')).toHaveCount(0);
}
