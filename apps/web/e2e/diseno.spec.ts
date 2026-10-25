import { randomUUID } from 'node:crypto';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';

import { esperarCarga, iniciarSesion } from './ayudas';
import { cedulaValida } from './identificacion';

/**
 * HT-13 (Claroscuro): cada pantalla cumple WCAG 2 AA con axe, muestra el foco al tabular, no
 * desborda a 360 px, no deja el foco bajo las barras fijas, pide recursos solo al mismo origen y,
 * en el portal del CLIENTE, ofrece objetivos de al menos 44 × 44 px. La Etapa B agrega entradas a `PANTALLAS`.
 */
const CUENTAS = {
  ADMIN: { email: 'admin@oasis.com', password: 'Admin.Oasis1' },
  OPERADOR: { email: 'operador@oasis.com', password: 'Operador.Oasis1' },
  CLIENTE: { email: 'cliente@oasis.com', password: 'Cliente.Oasis1' },
} as const;

type Rol = keyof typeof CUENTAS;

interface Pantalla {
  nombre: string;
  /** Ruta fija o resuelta en la prueba (p. ej., el id de un recibo). */
  ruta: string | ((request: APIRequestContext, ip: string) => Promise<string>);
  /** `null`: pantalla sin sesión. */
  rol: Rol | null;
  /** Elemento que indica que la pantalla terminó de cargar. */
  lista: (page: Page) => Locator;
}

const titulo = (nombre: string | RegExp) => (page: Page) =>
  page.getByRole('heading', { level: 1, name: nombre });

const PANTALLAS: Pantalla[] = [
  { nombre: 'inicio de sesión', ruta: '/login', rol: null, lista: titulo('Iniciar sesión') },
  { nombre: 'inicio del personal', ruta: '/', rol: 'OPERADOR', lista: titulo(/Hola,/) },
  { nombre: 'inicio del cliente', ruta: '/', rol: 'CLIENTE', lista: titulo(/Hola,/) },
  { nombre: 'pagos', ruta: '/pagos', rol: 'OPERADOR', lista: titulo('Pagos') },
  { nombre: 'recibos', ruta: '/recibos', rol: 'OPERADOR', lista: titulo('Recibos') },
  {
    nombre: 'detalle del recibo',
    ruta: rutaDetalleRecibo,
    rol: 'OPERADOR',
    lista: (page) => page.getByTestId('estado-recibo'),
  },
  {
    nombre: 'verificación',
    ruta: '/recibos/verificar',
    rol: 'OPERADOR',
    lista: titulo('Verificar recibo'),
  },
  { nombre: 'clientes', ruta: '/clientes', rol: 'OPERADOR', lista: titulo('Clientes') },
  { nombre: 'pólizas', ruta: '/polizas', rol: 'OPERADOR', lista: titulo('Pólizas') },
  {
    nombre: 'aseguradoras',
    ruta: '/aseguradoras',
    rol: 'ADMIN',
    lista: titulo(/aseguradoras/i),
  },
  { nombre: 'usuarios', ruta: '/usuarios', rol: 'ADMIN', lista: titulo(/usuarios/i) },
  { nombre: 'bitácora', ruta: '/bitacora', rol: 'ADMIN', lista: titulo('Bitácora') },
  {
    nombre: 'cambio de contraseña (personal)',
    ruta: '/cuenta/contrasena',
    rol: 'OPERADOR',
    lista: titulo('Cambiar contraseña'),
  },
  {
    nombre: 'cambio de contraseña (cliente)',
    ruta: '/cuenta/contrasena',
    rol: 'CLIENTE',
    lista: titulo('Cambiar contraseña'),
  },
];

const ESCRITORIO = { width: 1280, height: 800 };
const TELEFONO = { width: 360, height: 740 };
const PASOS_DE_TABULACION = 10;

/** Un recibo existente (preferiblemente anclado) o uno propio emitido al validar un pago nuevo. */
async function rutaDetalleRecibo(request: APIRequestContext, ip: string): Promise<string> {
  const login = await request.post('/api/v1/auth/login', {
    headers: { 'X-Forwarded-For': ip },
    data: CUENTAS.OPERADOR,
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = (await login.json()) as { accessToken: string };
  const headers = { Authorization: `Bearer ${accessToken}`, 'X-Forwarded-For': ip };

  for (const filtro of ['&estado=ANCLADO', '']) {
    const respuesta = await request.get(`/api/v1/recibos?page=1&pageSize=1${filtro}`, { headers });
    const { data } = (await respuesta.json()) as { data: Array<{ id: string }> };
    if (data.length > 0) return `/recibos/${data[0].id}`;
  }

  // Sin recibos, se emite uno sobre una póliza propia: los datos del seed no se alteran (D22).
  const polizaId = await crearPolizaPropia(request, headers);
  const pago = await request.post('/api/v1/pagos', {
    headers,
    data: {
      polizaId,
      monto: '10.00',
      fechaPago: new Date().toISOString().slice(0, 10),
      metodo: 'TRANSFERENCIA',
      referencia: `E2E-DISENO-${randomUUID()}`,
    },
  });
  expect(pago.ok()).toBeTruthy();
  const { id } = (await pago.json()) as { id: string };
  const validado = await request.patch(`/api/v1/pagos/${id}/validar`, {
    headers,
    data: { confirmado: true },
  });
  expect(validado.ok()).toBeTruthy();
  const { recibo } = (await validado.json()) as { recibo: { id: string } };
  return `/recibos/${recibo.id}`;
}

async function crearPolizaPropia(
  request: APIRequestContext,
  headers: Record<string, string>,
): Promise<string> {
  const sufijo = Date.now();
  const cliente = await request.post('/api/v1/clientes', {
    headers,
    data: {
      tipoIdentificacion: 'CEDULA',
      identificacion: cedulaValida(sufijo),
      nombres: 'Diseño',
      apellidos: `E2E ${sufijo}`,
      email: `diseno.${sufijo}@example.com`,
    },
  });
  expect(cliente.ok(), await cliente.text()).toBeTruthy();
  const { id: clienteId } = (await cliente.json()) as { id: string };
  const aseguradoras = (await (
    await request.get('/api/v1/aseguradoras?page=1&pageSize=1', { headers })
  ).json()) as { data: Array<{ id: string }> };
  const ramos = (await (await request.get('/api/v1/ramos', { headers })).json()) as Array<{
    id: string;
  }>;
  const hoy = new Date();
  const dia = (fecha: Date) => fecha.toISOString().slice(0, 10);
  const poliza = await request.post('/api/v1/polizas', {
    headers,
    data: {
      numero: `POL-DISENO-${randomUUID().slice(0, 8)}`,
      clienteId,
      aseguradoraId: aseguradoras.data[0].id,
      ramoId: ramos[0].id,
      primaTotal: '100.00',
      fechaInicio: dia(new Date(hoy.getTime() - 30 * 86_400_000)),
      fechaFin: dia(new Date(hoy.getTime() + 335 * 86_400_000)),
    },
  });
  expect(poliza.ok(), await poliza.text()).toBeTruthy();
  return ((await poliza.json()) as { id: string }).id;
}

async function abrir(page: Page, ruta: string, pantalla: Pantalla): Promise<void> {
  await page.goto(ruta);
  await expect(pantalla.lista(page)).toBeVisible();
  await esperarCarga(page);
}

async function sinViolacionesAxe(page: Page, contexto: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const resumen = violations.map((v) => ({
    regla: v.id,
    impacto: v.impact,
    ayuda: v.help,
    nodos: v.nodes.map((n) => ({ selector: n.target.join(' '), detalle: n.failureSummary })),
  }));
  expect.soft(resumen, `violaciones de axe en ${contexto}`).toEqual([]);
}

const enReposo = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animacion) => animacion.playState !== 'running'),
  );

/** Se ejecuta en el navegador: no puede usar nada de este módulo. */
function indicadorDeFoco(el: Element): { contorno: string; sombra: string } {
  const estilo = getComputedStyle(el);
  const contorno =
    estilo.outlineStyle !== 'none' && Number.parseFloat(estilo.outlineWidth) > 0
      ? `${estilo.outlineStyle} ${estilo.outlineWidth} ${estilo.outlineColor}`
      : 'none';
  return { contorno, sombra: estilo.boxShadow || 'none' };
}

/**
 * Tabula desde el inicio del documento y, en cada parada, compara el elemento enfocado con él mismo
 * sin foco: botones y tarjetas ya llevan sombra en reposo, así que solo cuenta un cambio.
 */
async function focoVisibleAlTabular(page: Page, contexto: string): Promise<void> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  let paradas = 0;
  for (let paso = 0; paso < PASOS_DE_TABULACION; paso++) {
    await page.keyboard.press('Tab');
    const enfocado = await page.evaluateHandle(() =>
      document.activeElement === document.body ? null : document.activeElement,
    );
    const elemento = enfocado.asElement();
    if (!elemento) continue;
    paradas++;
    const html = await elemento.evaluate((el) => el.outerHTML.slice(0, 160));
    await enReposo(page);
    const conFoco = await elemento.evaluate(indicadorDeFoco);
    await elemento.evaluate((el) => (el as HTMLElement).blur());
    await enReposo(page);
    const sinFoco = await elemento.evaluate(indicadorDeFoco);
    await elemento.evaluate((el) => (el as HTMLElement).focus());
    const cambia =
      (conFoco.contorno !== 'none' && conFoco.contorno !== sinFoco.contorno) ||
      (conFoco.sombra !== 'none' && conFoco.sombra !== sinFoco.sombra);
    expect
      .soft(cambia, `foco sin indicador en ${contexto}: ${html} (${JSON.stringify(conFoco)})`)
      .toBe(true);
  }
  expect(paradas, `ninguna parada de tabulación en ${contexto}`).toBeGreaterThan(0);
}

const PASOS_BAJO_BARRAS = 40;

/** WCAG 2.4.11: al tabular, el elemento enfocado no queda debajo de una barra fija o pegajosa. */
async function focoNoTapadoPorBarras(page: Page, contexto: string): Promise<void> {
  await expect(page.locator('[data-barra]').first()).toBeAttached();
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const tapados: string[] = [];
  for (let paso = 0; paso < PASOS_BAJO_BARRAS; paso++) {
    await page.keyboard.press('Tab');
    await enReposo(page);
    const tapado = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el.closest('[data-barra]')) return null;
      // El salto al contenido se superpone a propósito, por encima de todo (z-50).
      if (getComputedStyle(el).position === 'fixed') return null;
      const caja = el.getBoundingClientRect();
      for (const barra of document.querySelectorAll<HTMLElement>('[data-barra]')) {
        const posicion = getComputedStyle(barra).position;
        if (posicion !== 'fixed' && posicion !== 'sticky') continue;
        const b = barra.getBoundingClientRect();
        const seCruzan =
          caja.left < b.right && caja.right > b.left && caja.top < b.bottom && caja.bottom > b.top;
        if (seCruzan) {
          return `${el.outerHTML.slice(0, 120)} [${Math.round(caja.top)}–${Math.round(caja.bottom)}] bajo ${barra.dataset.barra} [${Math.round(b.top)}–${Math.round(b.bottom)}]`;
        }
      }
      return null;
    });
    if (tapado) tapados.push(tapado);
  }
  expect.soft(tapados, `foco bajo las barras fijas en ${contexto}`).toEqual([]);
}

async function sinDesborde(page: Page, contexto: string): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
      message: `desborde horizontal en ${contexto}`,
      timeout: 15_000,
    })
    .toBeLessThanOrEqual(TELEFONO.width);
}

const INTERACTIVOS =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, ' +
  '[role="button"], [role="link"], [role="tab"], [role="combobox"], [role="checkbox"], ' +
  '[tabindex]:not([tabindex="-1"])';

/** WCAG 2.5.5 en el portal del CLIENTE (DESIGN.md): todo objetivo visible mide ≥ 44 × 44. */
async function objetivosDe44(page: Page, contexto: string): Promise<void> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await enReposo(page);
  const pequenos: string[] = [];
  for (const objetivo of await page.locator(INTERACTIVOS).all()) {
    if (!(await objetivo.isVisible())) continue;
    // `sr-only` recorta el elemento (`clip-path: inset(50%)`) hasta que recibe el foco: se mide
    // enfocado, que es cuando se ve y se puede tocar.
    const estaRecortado = await objetivo.evaluate((el) => {
      const estilo = getComputedStyle(el);
      return estilo.clipPath !== 'none' || estilo.clip !== 'auto';
    });
    if (estaRecortado) {
      await objetivo.focus();
      await enReposo(page);
    }
    const caja = await objetivo.boundingBox();
    if (estaRecortado) await objetivo.blur();
    if (!caja) continue;
    if (caja.width < 44 || caja.height < 44) {
      const html = await objetivo.evaluate((el) => el.outerHTML.slice(0, 120));
      pequenos.push(`${Math.round(caja.width)}×${Math.round(caja.height)} ${html}`);
    }
  }
  expect.soft(pequenos, `objetivos menores de 44 × 44 px en ${contexto}`).toEqual([]);
}

PANTALLAS.forEach((pantalla, indice) => {
  test(`la pantalla «${pantalla.nombre}» cumple el sistema de diseño (${pantalla.rol ?? 'sin sesión'})`, async ({
    page,
    request,
    baseURL,
  }) => {
    const ip = `10.13.0.${indice + 1}`;
    await page.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });
    const origen = new URL(baseURL ?? 'http://localhost:5173').origin;
    const externas: string[] = [];
    page.on('request', (peticion) => {
      const url = new URL(peticion.url());
      if (url.protocol.startsWith('http') && url.origin !== origen) externas.push(peticion.url());
    });

    await page.setViewportSize(ESCRITORIO);
    if (pantalla.rol) {
      const cuenta = CUENTAS[pantalla.rol];
      await iniciarSesion(page, cuenta.email, cuenta.password);
    }
    const ruta =
      typeof pantalla.ruta === 'string'
        ? pantalla.ruta
        : await pantalla.ruta(request, `10.13.1.${indice + 1}`);

    await abrir(page, ruta, pantalla);
    await sinViolacionesAxe(page, `${pantalla.nombre} a 1280 px`);
    await focoVisibleAlTabular(page, pantalla.nombre);
    if (pantalla.rol === 'CLIENTE') await objetivosDe44(page, `${pantalla.nombre} a 1280 px`);

    await page.setViewportSize(TELEFONO);
    await abrir(page, ruta, pantalla);
    await sinDesborde(page, `${pantalla.nombre} a 360 px`);
    await sinViolacionesAxe(page, `${pantalla.nombre} a 360 px`);
    if (pantalla.rol) await focoNoTapadoPorBarras(page, `${pantalla.nombre} a 360 px`);
    if (pantalla.rol === 'CLIENTE') await objetivosDe44(page, `${pantalla.nombre} a 360 px`);

    expect(externas, `peticiones a otros orígenes en ${pantalla.nombre}`).toEqual([]);
  });
});

test('el riel se recorre con el teclado: Tab hasta un ítem y Enter navega (HT-13)', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.13.2.1' });
  await page.setViewportSize(ESCRITORIO);
  await iniciarSesion(page, CUENTAS.OPERADOR.email, CUENTAS.OPERADOR.password);
  await esperarCarga(page);

  const riel = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(riel.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');

  // El primer Tab alcanza el salto al contenido, y Enter lleva el foco al `main`.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#contenido')).toBeFocused();

  // Desde el inicio del documento, Tab hasta «Pagos» del riel y Enter.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  const pagos = riel.getByRole('link', { name: 'Pagos', exact: true });
  let alcanzado = false;
  for (let paso = 0; paso < 20 && !alcanzado; paso++) {
    await page.keyboard.press('Tab');
    alcanzado = await pagos.evaluate((el) => el === document.activeElement);
  }
  expect(alcanzado, 'el ítem «Pagos» del riel debe alcanzarse con Tab').toBe(true);
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/pagos$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Pagos' })).toBeVisible();
  await expect(pagos).toHaveAttribute('aria-current', 'page');
  await expect(riel.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  await expect(riel.locator('[aria-current="page"]')).toHaveCount(1);
});
