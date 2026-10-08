import { expect, test } from '@playwright/test';

import { iniciarSesion } from './ayudas';
import { cedulaValida } from './identificacion';

/**
 * HU-08, HU-09, HU-12, HU-13 y HU-14 de extremo a extremo con el OPERADOR:
 * alta, búsqueda, edición, desactivación y reactivación de un cliente; registro,
 * orden, filtros y cancelación de una póliza. Requiere la pila completa.
 */
test('el operador gestiona clientes y pólizas de extremo a extremo', async ({ page }) => {
  const sufijo = Date.now();
  const cedula = cedulaValida(sufijo);
  const nombres = 'Cliente';
  const apellidos = `PW ${sufijo}`;
  const nombreCompleto = `${nombres} ${apellidos}`;
  const numeroPoliza = `POL-PW-${sufijo}`;
  const filaCliente = () => page.getByRole('row', { name: new RegExp(nombreCompleto) });
  const accionesCliente = () => page.getByRole('button', { name: `Acciones de ${nombreCompleto}` });
  const filaPoliza = () => page.getByRole('row', { name: new RegExp(numeroPoliza) });
  const accionesPoliza = () => page.getByRole('button', { name: `Acciones de ${numeroPoliza}` });

  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.8.0.41' });
  await iniciarSesion(page, 'operador@oasis.com', 'Operador.Oasis1');

  // 1. Crea al cliente y lo busca por identificación.
  await page.getByRole('link', { name: 'Clientes' }).click();
  await page.getByTestId('boton-nuevo-cliente').click();
  await expect(page.getByRole('dialog', { name: 'Nuevo cliente' })).toBeVisible();
  await page.getByLabel('Identificación', { exact: true }).fill(cedula);
  await page.getByLabel('Nombres').fill(nombres);
  await page.getByLabel('Apellidos').fill(apellidos);
  await page.getByLabel('Correo electrónico').fill(`cliente.pw.${sufijo}@example.com`);
  await page.getByTestId('boton-guardar-cliente').click();
  await expect(page.getByText('Cliente creado')).toBeVisible();

  await page.getByLabel('Buscar clientes').fill(cedula);
  await expect(filaCliente()).toBeVisible();

  // 2. Lo edita (correo y teléfono).
  await accionesCliente().click();
  await page.getByRole('menuitem', { name: 'Editar' }).click();
  await expect(page.getByRole('dialog', { name: 'Editar cliente' })).toBeVisible();
  await page.getByLabel('Teléfono').fill('0998765432');
  await page.getByLabel('Correo electrónico').fill(`cliente.pw.editado.${sufijo}@example.com`);
  await page.getByTestId('boton-guardar-cliente').click();
  await expect(page.getByText('Cliente actualizado')).toBeVisible();
  await expect(filaCliente()).toContainText(`cliente.pw.editado.${sufijo}@example.com`);

  // 3. Lo desactiva con confirmación; solo aparece con el filtro de inactivos.
  await accionesCliente().click();
  await page.getByRole('menuitem', { name: 'Desactivar' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(
    'su historial de pólizas y pagos se conserva',
  );
  await page.getByTestId('confirmar-accion-cliente').click();
  await expect(page.getByText('Cliente desactivado')).toBeVisible();
  await expect(filaCliente()).toHaveCount(0);

  await page.locator('#filtro-estado-clientes').click();
  await page.getByRole('option', { name: 'Inactivos' }).click();
  await expect(filaCliente()).toHaveCount(1);

  await page.locator('#filtro-estado-clientes').click();
  await page.getByRole('option', { name: 'Activos', exact: true }).click();
  await expect(filaCliente()).toHaveCount(0);

  // 4. En "Nueva póliza" el combobox no ofrece al cliente inactivo.
  await page.getByRole('link', { name: 'Pólizas' }).click();
  await page.getByTestId('boton-nueva-poliza').click();
  const dialogoPoliza = page.getByRole('dialog', { name: 'Nueva póliza' });
  await expect(dialogoPoliza).toBeVisible();
  await dialogoPoliza.getByRole('combobox', { name: 'Cliente' }).fill(nombreCompleto);
  await expect(dialogoPoliza.getByText('Sin resultados')).toBeVisible();
  await dialogoPoliza.getByRole('button', { name: 'Cerrar' }).click();
  await expect(dialogoPoliza).toHaveCount(0);

  // 5. Reactiva al cliente y registra una póliza con él.
  await page.getByRole('link', { name: 'Clientes' }).click();
  await page.locator('#filtro-estado-clientes').click();
  await page.getByRole('option', { name: 'Inactivos' }).click();
  await page.getByLabel('Buscar clientes').fill(cedula);
  await accionesCliente().click();
  await page.getByRole('menuitem', { name: 'Reactivar' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(
    'Volverá a estar disponible al registrar nuevas pólizas',
  );
  await page.getByTestId('confirmar-accion-cliente').click();
  await expect(page.getByText('Cliente reactivado')).toBeVisible();

  await page.getByRole('link', { name: 'Pólizas' }).click();
  await page.getByTestId('boton-nueva-poliza').click();
  await expect(dialogoPoliza).toBeVisible();
  await dialogoPoliza.getByLabel('Número').fill(numeroPoliza);
  await dialogoPoliza.getByRole('combobox', { name: 'Cliente' }).fill(nombreCompleto);
  await expect(
    page.getByRole('option', { name: new RegExp(`${nombreCompleto}.*${cedula}`) }),
  ).toBeVisible();
  await page.getByRole('option', { name: new RegExp(`${nombreCompleto}.*${cedula}`) }).click();
  await dialogoPoliza.getByLabel('Aseguradora').click();
  await page.getByRole('option', { name: 'Aseguradora del Pacífico C.A.' }).click();
  await dialogoPoliza.getByLabel('Ramo').click();
  await page.getByRole('option', { name: 'Vehículos' }).click();
  await dialogoPoliza.getByLabel('Prima total').fill('250.75');
  await dialogoPoliza.getByLabel('Fecha de inicio').fill('2026-11-01');
  await dialogoPoliza.getByLabel('Fecha de fin').fill('2027-10-31');
  await dialogoPoliza.getByTestId('boton-guardar-poliza').click();
  await expect(page.getByText('Póliza registrada')).toBeVisible();

  // 6. Filtra por cliente y por estado, y ordena por vigencia.
  await page.locator('#filtro-cliente-polizas').fill(nombreCompleto);
  await page.getByRole('option', { name: new RegExp(nombreCompleto) }).click();
  await expect(filaPoliza()).toBeVisible();

  const encabezadoVigencia = page.locator('th', { has: page.getByTestId('orden-vigencia') });
  await page.getByTestId('orden-vigencia').click();
  await expect(encabezadoVigencia).toHaveAttribute('aria-sort', 'ascending');
  await page.getByTestId('orden-vigencia').click();
  await expect(encabezadoVigencia).toHaveAttribute('aria-sort', 'descending');

  await page.locator('#filtro-estado-polizas').click();
  await page.getByRole('option', { name: 'Vigente' }).click();
  await expect(filaPoliza()).toContainText('VIGENTE');

  // 7. La cancela con confirmación: la fila conserva el historial pero deja de ofrecer acciones.
  await accionesPoliza().click();
  await page.getByRole('menuitem', { name: 'Cancelar póliza' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Esta acción es definitiva');
  await page.getByTestId('confirmar-accion-poliza').click();
  await expect(page.getByText('Póliza cancelada')).toBeVisible();

  await page.locator('#filtro-estado-polizas').click();
  await page.getByRole('option', { name: 'Todos los estados' }).click();
  await expect(filaPoliza()).toContainText('CANCELADA');
  await expect(accionesPoliza()).toHaveCount(0);
});

/**
 * D16: con la lista del combobox abierta dentro del diálogo, Escape cierra solo la
 * lista y el diálogo permanece abierto.
 */
test('el combobox cierra su lista con Escape sin cerrar el diálogo (HU-12, D16)', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.8.0.42' });
  await iniciarSesion(page, 'operador@oasis.com', 'Operador.Oasis1');

  await page.goto('/polizas');
  await page.getByTestId('boton-nueva-poliza').click();
  const dialogo = page.getByRole('dialog', { name: 'Nueva póliza' });
  await expect(dialogo).toBeVisible();

  await dialogo.getByRole('combobox', { name: 'Cliente' }).click();
  await expect(page.getByRole('listbox')).toBeVisible();

  await dialogo.getByRole('combobox', { name: 'Cliente' }).press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(dialogo).toBeVisible();
});
