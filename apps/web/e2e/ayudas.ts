import { randomUUID } from 'node:crypto';

import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { fechaEnGuayaquil } from '@oasis/shared';

import { cedulaValida } from './identificacion';

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

/** D6: la fecha de pago no puede ser futura en Guayaquil (en UTC ya es «mañana» desde las 19:00). */
export const hoyEnGuayaquil = (): string => fechaEnGuayaquil(new Date());

/** Cabeceras con el token de una sesión abierta por API y la IP propia de la prueba. */
export async function cabecerasDeSesion(
  request: APIRequestContext,
  ip: string,
  credenciales: { email: string; password: string },
): Promise<Record<string, string>> {
  const login = await request.post('/api/v1/auth/login', {
    headers: { 'X-Forwarded-For': ip },
    data: credenciales,
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = (await login.json()) as { accessToken: string };
  return { Authorization: `Bearer ${accessToken}`, 'X-Forwarded-For': ip };
}

/**
 * Póliza VIGENTE propia de la prueba (D22): los datos del seed no se alteran y RN-02 no agota su
 * saldo entre corridas. Sin `clienteId`, crea también un cliente nuevo.
 */
export async function crearPolizaPropia(
  request: APIRequestContext,
  headers: Record<string, string>,
  opciones: { clienteId?: string; prima?: string } = {},
): Promise<{ id: string; numero: string }> {
  let clienteId = opciones.clienteId;
  if (!clienteId) {
    const sufijo = Date.now();
    const cliente = await request.post('/api/v1/clientes', {
      headers,
      data: {
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo),
        nombres: 'Cliente',
        apellidos: `E2E ${sufijo}`,
        email: `e2e.${sufijo}@example.com`,
      },
    });
    expect(cliente.ok(), await cliente.text()).toBeTruthy();
    clienteId = ((await cliente.json()) as { id: string }).id;
  }
  const aseguradoras = (await (
    await request.get('/api/v1/aseguradoras?page=1&pageSize=1', { headers })
  ).json()) as { data: Array<{ id: string }> };
  const ramos = (await (await request.get('/api/v1/ramos', { headers })).json()) as Array<{
    id: string;
  }>;
  const hoy = new Date();
  const dia = (fecha: Date) => fecha.toISOString().slice(0, 10);
  const numero = `POL-E2E-${randomUUID().slice(0, 8)}`;
  const poliza = await request.post('/api/v1/polizas', {
    headers,
    data: {
      numero,
      clienteId,
      aseguradoraId: aseguradoras.data[0].id,
      ramoId: ramos[0].id,
      primaTotal: opciones.prima ?? '100.00',
      fechaInicio: dia(new Date(hoy.getTime() - 30 * 86_400_000)),
      fechaFin: dia(new Date(hoy.getTime() + 335 * 86_400_000)),
    },
  });
  expect(poliza.ok(), await poliza.text()).toBeTruthy();
  return { id: ((await poliza.json()) as { id: string }).id, numero };
}
