import { expect, test, type Page } from '@playwright/test';

import { esperarCarga, iniciarSesion } from './ayudas';

/**
 * HT-04.5: ninguna ruta desborda a 360 px. Recorre las rutas del menú de cada rol y
 * comprueba el ancho del documento tras cargar los datos. Requiere la pila completa.
 */
const CUENTAS = {
  ADMIN: { email: 'admin@oasis.com', password: 'Admin.Oasis1' },
  OPERADOR: { email: 'operador@oasis.com', password: 'Operador.Oasis1' },
  CLIENTE: { email: 'cliente@oasis.com', password: 'Cliente.Oasis1' },
} as const;

type Rol = keyof typeof CUENTAS;

const RUTAS: Record<Rol, string[]> = {
  ADMIN: [
    '/',
    '/pagos',
    '/recibos',
    '/recibos/verificar',
    '/clientes',
    '/polizas',
    '/aseguradoras',
    '/usuarios',
    '/bitacora',
    '/cuenta/contrasena',
  ],
  OPERADOR: [
    '/',
    '/pagos',
    '/recibos',
    '/recibos/verificar',
    '/clientes',
    '/polizas',
    '/aseguradoras',
    '/cuenta/contrasena',
  ],
  CLIENTE: ['/', '/cuenta/contrasena'],
};

test.use({ viewport: { width: 360, height: 740 } });

async function sinDesborde(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await expect(page.locator('main')).toBeVisible();
  await esperarCarga(page);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
      message: `desborde horizontal en ${ruta}`,
      timeout: 15_000,
    })
    .toBeLessThanOrEqual(360);
}

/** Igual que `sinDesborde`, pero sobre la pantalla ya abierta (diálogos, listas). */
async function sinDesbordeActual(page: Page, mensaje: string): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
      message: mensaje,
      timeout: 15_000,
    })
    .toBeLessThanOrEqual(360);
}

for (const rol of Object.keys(CUENTAS) as Rol[]) {
  test(`sin desborde a 360 px: ${rol}`, async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'X-Forwarded-For': `10.5.0.${rol === 'ADMIN' ? 31 : rol === 'OPERADOR' ? 32 : 33}`,
    });
    await iniciarSesion(page, CUENTAS[rol].email, CUENTAS[rol].password);

    for (const ruta of RUTAS[rol]) {
      await sinDesborde(page, ruta);
    }

    // El detalle de un recibo, si el seed o una corrida anterior dejó alguno.
    if (rol !== 'CLIENTE') {
      await page.goto('/recibos');
      await esperarCarga(page);
      const enlace = page.locator('[data-testid^="enlace-recibo-"]').first();
      if ((await enlace.count()) > 0) {
        const href = await enlace.getAttribute('href');
        if (href) {
          await sinDesborde(page, href);
        }
      }
    }
  });
}

test('sin desborde a 360 px con los diálogos abiertos (HU-08 a HU-12)', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.5.0.41' });
  await iniciarSesion(page, 'operador@oasis.com', 'Operador.Oasis1');

  await page.goto('/clientes');
  await esperarCarga(page);
  await page.getByTestId('boton-nuevo-cliente').click();
  await expect(page.getByRole('dialog', { name: 'Nuevo cliente' })).toBeVisible();
  await sinDesbordeActual(page, 'desborde en el diálogo de nuevo cliente');
  await page.getByRole('button', { name: 'Cerrar' }).click();

  await page.goto('/polizas');
  await esperarCarga(page);
  await page.getByTestId('boton-nueva-poliza').click();
  const dialogo = page.getByRole('dialog', { name: 'Nueva póliza' });
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole('combobox', { name: 'Cliente' }).click();
  await sinDesbordeActual(page, 'desborde en el diálogo de nueva póliza');
  await dialogo.getByRole('button', { name: 'Cerrar' }).click();
});
