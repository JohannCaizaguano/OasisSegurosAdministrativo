import { expect, test } from '@playwright/test';

import { iniciarSesion } from './ayudas';
import { cedulaValida } from './identificacion';

/**
 * HU-04 y HU-07 de extremo a extremo con dos contextos: el ADMIN crea un operador y le
 * entrega la contraseña temporal; el operador registra un cliente y ve el duplicado; al
 * desactivarlo, su siguiente acción lo devuelve al login. Requiere la pila completa.
 */
test('el personal gestiona usuarios y clientes entre dos contextos', async ({ browser }) => {
  const sufijo = Date.now();
  const nombreOperador = `Operador PW ${sufijo}`;
  const emailOperador = `e2e.pw.${sufijo}@example.com`;

  const contextoAdmin = await browser.newContext();
  await contextoAdmin.grantPermissions(['clipboard-read', 'clipboard-write']);
  const paginaAdmin = await contextoAdmin.newPage();
  await paginaAdmin.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.4.0.21' });
  await iniciarSesion(paginaAdmin, 'admin@oasis.com', 'Admin.Oasis1');

  // 1. El ADMIN crea un operador y copia la contraseña temporal del diálogo.
  await paginaAdmin.getByRole('link', { name: 'Usuarios' }).click();
  await paginaAdmin.getByTestId('boton-nuevo-usuario').click();
  await paginaAdmin.getByLabel('Nombre').fill(nombreOperador);
  await paginaAdmin.getByLabel('Correo electrónico').fill(emailOperador);
  await paginaAdmin.getByTestId('boton-guardar-usuario').click();

  await expect(paginaAdmin.getByText('Esta contraseña no se volverá a mostrar.')).toBeVisible();
  const contrasenaTemporal = (
    (await paginaAdmin.getByTestId('contrasena-temporal').textContent()) ?? ''
  ).trim();
  expect(contrasenaTemporal).toHaveLength(16);
  await paginaAdmin.getByTestId('boton-copiar-contrasena').click();
  await expect(paginaAdmin.getByText('Contraseña copiada')).toBeVisible();
  await expect
    .poll(() => paginaAdmin.evaluate(() => navigator.clipboard.readText()))
    .toBe(contrasenaTemporal);
  await paginaAdmin.getByRole('button', { name: 'Listo' }).click();
  await expect(paginaAdmin.getByTestId('contrasena-temporal')).toHaveCount(0);

  // 2. El operador inicia sesión con esa contraseña y registra un cliente.
  const contextoOperador = await browser.newContext();
  const paginaOperador = await contextoOperador.newPage();
  await paginaOperador.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.4.0.22' });
  await iniciarSesion(paginaOperador, emailOperador, contrasenaTemporal);

  // El menú del OPERADOR no ofrece Usuarios y /usuarios lo devuelve al inicio.
  await expect(paginaOperador.getByRole('link', { name: 'Aseguradoras' })).toBeVisible();
  await expect(paginaOperador.getByRole('link', { name: 'Usuarios' })).toHaveCount(0);
  await paginaOperador.goto('/usuarios');
  await expect(paginaOperador).toHaveURL(/\/$/);

  await paginaOperador.getByRole('link', { name: 'Clientes' }).click();
  const cedula = cedulaValida(sufijo);
  await paginaOperador.getByTestId('boton-nuevo-cliente').click();
  await paginaOperador.getByLabel('Identificación', { exact: true }).fill(cedula);
  await paginaOperador.getByLabel('Nombres').fill('Cliente');
  await paginaOperador.getByLabel('Apellidos').fill('Playwright');
  await paginaOperador.getByLabel('Correo electrónico').fill(`cliente.pw.${sufijo}@example.com`);
  await paginaOperador.getByTestId('boton-guardar-cliente').click();
  await expect(paginaOperador.getByText('Cliente creado')).toBeVisible();

  // 3. La misma identificación se rechaza en el campo con un mensaje claro.
  await paginaOperador.getByTestId('boton-nuevo-cliente').click();
  await paginaOperador.getByLabel('Identificación', { exact: true }).fill(cedula);
  await paginaOperador.getByLabel('Nombres').fill('Cliente');
  await paginaOperador.getByLabel('Apellidos').fill('Repetido');
  await paginaOperador
    .getByLabel('Correo electrónico')
    .fill(`cliente.pw.repetido.${sufijo}@example.com`);
  await paginaOperador.getByTestId('boton-guardar-cliente').click();
  await expect(
    paginaOperador.getByText('Ya existe un cliente con esa identificación'),
  ).toBeVisible();

  // 4. El ADMIN desactiva al operador.
  await paginaAdmin.getByRole('button', { name: `Acciones de ${nombreOperador}` }).click();
  await paginaAdmin.getByRole('menuitem', { name: 'Desactivar' }).click();
  await paginaAdmin.getByTestId('confirmar-accion').click();
  await expect(
    paginaAdmin.getByText('Usuario desactivado; se cerraron sus sesiones'),
  ).toBeVisible();

  // 5. La siguiente acción del operador lo devuelve al login.
  await paginaOperador.goto('/pagos');
  await expect(paginaOperador).toHaveURL(/\/login/, { timeout: 20_000 });

  await contextoAdmin.close();
  await contextoOperador.close();
});
