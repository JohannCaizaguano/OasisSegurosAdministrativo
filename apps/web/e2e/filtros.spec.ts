import { randomUUID } from 'node:crypto';

import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  cabecerasDeSesion,
  crearPolizaPropia,
  esperarCarga,
  hoyEnGuayaquil,
  iniciarSesion,
} from './ayudas';

/**
 * Menor 5 de T20: los filtros de la URL se muestran en su combobox al recargar, el filtro de
 * Pagos alcanza pólizas de cualquier estado y el formulario de pago sigue ofreciendo solo VIGENTES
 * (RN-01). «Limpiar filtros» y la X de cada combobox vacían la URL y la etiqueta.
 */
const OPERADOR = { email: 'operador@oasis.com', password: 'Operador.Oasis1' };

async function nombreDelCliente(
  request: APIRequestContext,
  cabeceras: Record<string, string>,
  clienteId: string,
): Promise<string> {
  const respuesta = await request.get(`/api/v1/clientes/${clienteId}`, { headers: cabeceras });
  expect(respuesta.ok(), await respuesta.text()).toBeTruthy();
  const cliente = (await respuesta.json()) as {
    nombres?: string | null;
    apellidos?: string | null;
    razonSocial?: string | null;
  };
  return cliente.razonSocial ?? [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ');
}

async function registrarPago(
  request: APIRequestContext,
  cabeceras: Record<string, string>,
  polizaId: string,
): Promise<string> {
  const referencia = `DB-${randomUUID().slice(0, 8)}`;
  const respuesta = await request.post('/api/v1/pagos', {
    headers: cabeceras,
    data: {
      polizaId,
      monto: '10.00',
      fechaPago: hoyEnGuayaquil(),
      metodo: 'TRANSFERENCIA',
      referencia,
    },
  });
  expect(respuesta.ok(), await respuesta.text()).toBeTruthy();
  return referencia;
}

async function cancelarPoliza(
  request: APIRequestContext,
  cabeceras: Record<string, string>,
  polizaId: string,
): Promise<void> {
  const respuesta = await request.post(`/api/v1/polizas/${polizaId}/estado`, {
    headers: cabeceras,
    data: { estado: 'CANCELADA' },
  });
  expect(respuesta.ok(), await respuesta.text()).toBeTruthy();
}

test('al recargar con ?polizaId= o ?clienteId= los combobox muestran la etiqueta del filtro', async ({
  page,
  request,
}) => {
  const ip = '10.55.0.1';
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });
  const cabeceras = await cabecerasDeSesion(request, '10.55.1.1', OPERADOR);
  const poliza = await crearPolizaPropia(request, cabeceras);
  const nombre = await nombreDelCliente(request, cabeceras, poliza.clienteId);

  await iniciarSesion(page, OPERADOR.email, OPERADOR.password);

  await page.goto(`/pagos?polizaId=${poliza.id}`);
  await esperarCarga(page);
  await expect(page.getByRole('combobox', { name: 'Póliza' })).toHaveValue(poliza.numero);

  await page.goto(`/pagos?clienteId=${poliza.clienteId}`);
  await esperarCarga(page);
  await expect(page.getByRole('combobox', { name: 'Cliente' })).toHaveValue(nombre);

  await page.goto(`/cartera?clienteId=${poliza.clienteId}`);
  await esperarCarga(page);
  await expect(page.getByRole('combobox', { name: 'Cliente' })).toHaveValue(nombre);
});

test('el filtro de Pagos encuentra una póliza CANCELADA y el formulario no la ofrece (RN-01)', async ({
  page,
  request,
}) => {
  const ip = '10.55.0.2';
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });
  const cabeceras = await cabecerasDeSesion(request, '10.55.1.2', OPERADOR);
  const poliza = await crearPolizaPropia(request, cabeceras);
  const referencia = await registrarPago(request, cabeceras, poliza.id);
  await cancelarPoliza(request, cabeceras, poliza.id);

  await iniciarSesion(page, OPERADOR.email, OPERADOR.password);
  await page.goto('/pagos');
  await esperarCarga(page);

  const filtro = page.getByRole('combobox', { name: 'Póliza' });
  await filtro.fill(poliza.numero);
  const lista = page.getByRole('listbox', { name: 'Pólizas' });
  const opcion = lista.getByRole('option', { name: new RegExp(poliza.numero) });
  await expect(opcion).toBeVisible();
  await opcion.click();

  await expect(page).toHaveURL(new RegExp(`polizaId=${poliza.id}`));
  await expect(filtro).toHaveValue(poliza.numero);
  await esperarCarga(page);
  await expect(page.getByText(referencia)).toBeVisible();

  await page.getByTestId('boton-nuevo-pago').click();
  const dialogo = page.getByRole('dialog', { name: 'Registrar pago' });
  const enFormulario = dialogo.getByRole('combobox', { name: 'Póliza' });
  await enFormulario.fill(poliza.numero);
  await expect(dialogo.getByRole('listbox', { name: 'Pólizas vigentes' })).toBeVisible();
  await expect(dialogo.getByText('Sin resultados')).toBeVisible();
  await expect(dialogo.getByRole('option', { name: new RegExp(poliza.numero) })).toHaveCount(0);
});

test('«Limpiar filtros» y la X de los combobox vacían la URL y la etiqueta', async ({
  page,
  request,
}) => {
  const ip = '10.55.0.3';
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });
  const cabeceras = await cabecerasDeSesion(request, '10.55.1.3', OPERADOR);
  const poliza = await crearPolizaPropia(request, cabeceras);
  const nombre = await nombreDelCliente(request, cabeceras, poliza.clienteId);

  await iniciarSesion(page, OPERADOR.email, OPERADOR.password);
  await page.goto(`/pagos?polizaId=${poliza.id}&clienteId=${poliza.clienteId}`);
  await esperarCarga(page);

  const polizaDePagos = page.getByRole('combobox', { name: 'Póliza' });
  const clienteDePagos = page.getByRole('combobox', { name: 'Cliente' });
  await expect(polizaDePagos).toHaveValue(poliza.numero);
  await expect(clienteDePagos).toHaveValue(nombre);

  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page).toHaveURL(/\/pagos$/);
  await expect(polizaDePagos).toHaveValue('');
  await expect(clienteDePagos).toHaveValue('');

  await page.goto(`/pagos?polizaId=${poliza.id}&clienteId=${poliza.clienteId}`);
  await esperarCarga(page);
  await expect(page.getByTestId('filtro-poliza-pagos-quitar')).toBeVisible();
  await page.getByTestId('filtro-poliza-pagos-quitar').click();
  await expect(page).not.toHaveURL(/polizaId/);
  await expect(page.getByRole('combobox', { name: 'Póliza' })).toHaveValue('');
  await page.getByTestId('filtro-cliente-pagos-quitar').click();
  await expect(page).toHaveURL(/\/pagos$/);
  await expect(page.getByRole('combobox', { name: 'Cliente' })).toHaveValue('');

  await page.goto(`/cartera?clienteId=${poliza.clienteId}`);
  await esperarCarga(page);
  await expect(page.getByRole('combobox', { name: 'Cliente' })).toHaveValue(nombre);
  await page.getByTestId('filtro-cliente-cartera-quitar').click();
  await expect(page).toHaveURL(/\/cartera$/);
  await expect(page.getByRole('combobox', { name: 'Cliente' })).toHaveValue('');
});
