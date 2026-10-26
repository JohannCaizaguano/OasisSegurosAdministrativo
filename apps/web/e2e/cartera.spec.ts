import { expect, test } from '@playwright/test';

import { cabecerasDeSesion, crearPolizaPropia, esperarCarga, iniciarSesion } from './ayudas';

/**
 * HU-38 (cartera) y HU-51 (cobertura en el detalle): el operador filtra las vencidas de un cliente
 * y llega a la póliza con su cobertura. La póliza propia nace hace 30 días con su cuota única
 * vencida en el inicio (D11), así que aparece en «Vencidas» sin depender del cron.
 */
const OPERADOR = { email: 'operador@oasis.com', password: 'Operador.Oasis1' };

test('el operador filtra las cuotas vencidas y llega a la póliza con su cobertura (HU-38, HU-51.3)', async ({
  page,
  request,
}) => {
  const ip = '10.38.0.1';
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });
  const cabeceras = await cabecerasDeSesion(request, '10.38.1.1', OPERADOR);
  const cobertura = 'Vida y accidentes personales\nAsistencia en viajes';
  const poliza = await crearPolizaPropia(request, cabeceras, {
    cobertura,
    condiciones: 'Carencia de 30 días',
  });

  await iniciarSesion(page, OPERADOR.email, OPERADOR.password);
  await page.getByRole('link', { name: 'Cartera' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Cartera' })).toBeVisible();

  // El filtro de cliente vive en la URL (D15, D16): se abre ya acotado al cliente de la prueba.
  await page.goto(`/cartera?clienteId=${poliza.clienteId}`);
  const vistas = page.getByRole('group', { name: 'Vista de la cartera' });
  await vistas.getByRole('button', { name: 'Vencidas' }).click();
  await expect(vistas.getByRole('button', { name: 'Vencidas' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page).toHaveURL(/vista=VENCIDAS/);
  await esperarCarga(page);

  const fila = page.locator('tbody tr', { hasText: poliza.numero });
  await expect(fila).toHaveCount(1);
  await expect(fila.getByTestId('dias-atraso')).toHaveText(/^\d+ días$/);
  await expect(fila.getByTestId('dias-atraso')).toHaveAttribute('data-tono', /^(aviso|error)$/);
  await expect(fila.locator('[data-estado]')).toHaveAttribute(
    'data-estado',
    /^(PENDIENTE|VENCIDA)$/,
  );

  await vistas.getByRole('button', { name: 'Por vencer' }).click();
  await esperarCarga(page);
  await expect(page.locator('tbody tr', { hasText: poliza.numero })).toHaveCount(0);

  await vistas.getByRole('button', { name: 'Vencidas' }).click();
  await page.getByRole('link', { name: poliza.numero }).click();

  await expect(page).toHaveURL(new RegExp(`/polizas/${poliza.id}$`));
  await expect(
    page.getByRole('heading', { level: 1, name: `Póliza ${poliza.numero}` }),
  ).toBeVisible();
  await expect(page.getByTestId('cobertura')).toHaveText(cobertura);
  await expect(page.getByTestId('condiciones')).toHaveText('Carencia de 30 días');
  await expect(page.getByRole('list', { name: 'Plan de cuotas' })).toBeVisible();
});

test('el CLIENTE no ve la cartera en su navegación (D16)', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.38.0.2' });
  await iniciarSesion(page, 'cliente@oasis.com', 'Cliente.Oasis1');
  await esperarCarga(page);

  await expect(page.getByRole('link', { name: 'Cartera' })).toHaveCount(0);
});
