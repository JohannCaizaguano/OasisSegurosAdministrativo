import { randomUUID } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';
import { MOTIVOS_RECHAZO_FRECUENTES } from '@oasis/shared';

import { cabecerasDeSesion, crearPolizaPropia, esperarCarga, iniciarSesion } from './ayudas';

/**
 * HU-16, HU-18, HU-19 y HU-35 por la interfaz: registrar con Débito bancario, validar en tres
 * acciones, rechazar con un chip, el motivo en el portal del CLIENTE y un plan de 3 cuotas.
 */
const OPERADOR = { email: 'operador@oasis.com', password: 'Operador.Oasis1' };
const CLIENTE = { email: 'cliente@oasis.com', password: 'Cliente.Oasis1' };
const IP = '10.16.0.1';

async function registrarPagoPorLaInterfaz(page: Page, numeroPoliza: string, referencia: string) {
  await page.getByTestId('boton-nuevo-pago').click();
  const dialogo = page.getByRole('dialog', { name: 'Registrar pago' });
  const poliza = dialogo.getByRole('combobox', { name: 'Póliza' });
  await poliza.fill(numeroPoliza);
  await dialogo.getByRole('option', { name: new RegExp(numeroPoliza) }).click();
  await dialogo.getByLabel('Monto').fill('50.00');
  await expect(dialogo.getByLabel('Método')).toHaveText('Débito bancario');
  await dialogo.getByLabel('Referencia').fill(referencia);
  await dialogo.getByRole('button', { name: 'Registrar pago' }).click();
  await expect(dialogo).toBeHidden();
}

test('el operador registra, valida y rechaza pagos; el cliente ve el motivo; se define un plan de 3 cuotas', async ({
  page,
  request,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': IP });
  const cabeceras = await cabecerasDeSesion(request, IP, OPERADOR);
  const clientes = (await (
    await request.get('/api/v1/clientes?q=Cabrera&page=1&pageSize=1', { headers: cabeceras })
  ).json()) as { data: Array<{ id: string }> };
  const polizaPagos = await crearPolizaPropia(request, cabeceras, {
    clienteId: clientes.data[0].id,
    prima: '300.00',
  });
  const polizaPlan = await crearPolizaPropia(request, cabeceras, { prima: '100.00' });
  const referenciaValidar = `DB-${randomUUID().slice(0, 8)}`;
  const referenciaRechazar = `DB-${randomUUID().slice(0, 8)}`;
  const motivo = MOTIVOS_RECHAZO_FRECUENTES[1];

  // HU-16: registrar con Débito bancario.
  await iniciarSesion(page, OPERADOR.email, OPERADOR.password);
  await page.getByRole('link', { name: 'Pagos', exact: true }).click();
  await esperarCarga(page);
  await registrarPagoPorLaInterfaz(page, polizaPagos.numero, referenciaValidar);
  await registrarPagoPorLaInterfaz(page, polizaPagos.numero, referenciaRechazar);

  // HU-18: tres acciones desde la fila y el código del recibo en el aviso.
  const filaValidar = page.locator('tbody tr', { hasText: referenciaValidar });
  await filaValidar.getByRole('button', { name: 'Validar' }).click();
  const validar = page.getByRole('dialog', { name: 'Validar pago' });
  await validar.getByLabel(/confirmo que revisé/i).check();
  await validar.getByTestId('confirmar-validar').click();
  await expect(page.getByText(/Recibo RC-[0-9A-F]{12} emitido/).first()).toBeVisible();
  await expect(filaValidar.locator('[data-estado="VALIDADO"]')).toBeVisible();

  // HU-19: rechazar con un chip de motivo frecuente.
  const filaRechazar = page.locator('tbody tr', { hasText: referenciaRechazar });
  await filaRechazar.getByRole('button', { name: 'Rechazar' }).click();
  const rechazar = page.getByRole('dialog', { name: 'Rechazar pago' });
  await expect(rechazar.getByTestId('confirmar-rechazar')).toBeDisabled();
  await rechazar.getByRole('button', { name: motivo }).click();
  await rechazar.getByTestId('confirmar-rechazar').click();
  await expect(filaRechazar.locator('[data-estado="RECHAZADO"]')).toBeVisible();

  // HU-35: plan de 3 cuotas que cuadra con la prima.
  await page.getByRole('link', { name: 'Pólizas', exact: true }).click();
  await esperarCarga(page);
  await page.getByRole('button', { name: `Plan de cuotas de ${polizaPlan.numero}` }).click();
  const plan = page.getByRole('dialog', {
    name: new RegExp(`Plan de cuotas · ${polizaPlan.numero}`),
  });
  await plan.getByRole('button', { name: 'Cambiar plan' }).click();
  await plan.getByLabel('Número de cuotas').fill('3');
  await plan.getByRole('button', { name: 'Proponer' }).click();
  await expect(plan.getByRole('status')).toHaveText('Cuadra con la prima');
  await plan.getByRole('button', { name: 'Guardar plan' }).click();
  await expect(plan.getByRole('cell', { name: '$33,34' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(plan).toBeHidden();

  // HU-19: el CLIENTE ve el motivo en su portal.
  await page.getByTestId('menu-usuario').click();
  await page.getByTestId('boton-logout').click();
  await iniciarSesion(page, CLIENTE.email, CLIENTE.password);
  await expect(page.getByText(motivo).first()).toBeVisible();
});
