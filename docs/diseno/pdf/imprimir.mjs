/* global document, window, Image -- se usan dentro de page.evaluate, en el navegador */
// Imprime docs/diseno/SRPP-diseno-final-claroscuro.pdf desde index.html con el Chromium de
// @playwright/test de apps/web. Desde la raíz del repositorio:
//   pnpm --filter @oasis/web exec node ../../docs/diseno/pdf/imprimir.mjs              imprime el PDF
//   pnpm --filter @oasis/web exec node ../../docs/diseno/pdf/imprimir.mjs --prototipo  recaptura el prototipo e imprime
//   pnpm --filter @oasis/web exec node ../../docs/diseno/pdf/imprimir.mjs --spa <dir>  importa capturas PNG de la SPA e imprime
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../../', import.meta.url));
const CAPTURAS = join(RAIZ, 'docs/diseno/pdf/capturas');
const SALIDA = join(RAIZ, 'docs/diseno/SRPP-diseno-final-claroscuro.pdf');
const { chromium } = createRequire(join(RAIZ, 'apps/web/package.json'))('@playwright/test');

// Ancho máximo de cada captura: lo que ocupa en la hoja A4 a ~200 ppp. JPEG porque Chromium lo
// incrusta tal cual en el PDF; PNG o WebP se reescriben sin pérdida y el archivo crece varias veces.
const ANCHO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.8;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

// El prototipo vive dentro de una IIFE; para llevarlo a cada pantalla se exponen su estado y sus
// funciones de navegación solo en la copia que sirve este script.
const GANCHO = "document.documentElement.lang='es-EC';\nrender();";
function servir() {
  const servidor = createServer((req, res) => {
    const ruta = normalize(join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!ruta.startsWith(RAIZ) || !statSync(ruta, { throwIfNoEntry: false })?.isFile()) {
      res.writeHead(404).end();
      return;
    }
    let cuerpo = readFileSync(ruta);
    if (ruta.endsWith(`prototipo${sep}index.html`)) {
      const html = cuerpo.toString('utf8');
      if (!html.includes(GANCHO))
        throw new Error('El prototipo cambió: actualice GANCHO en imprimir.mjs');
      cuerpo = html.replace(
        GANCHO,
        `window.__proto={UI,go,setRole,render,mGo,mTab,get D(){return D}};\n${GANCHO}`,
      );
    }
    res
      .writeHead(200, { 'content-type': TIPOS[extname(ruta)] ?? 'application/octet-stream' })
      .end(cuerpo);
  });
  return new Promise((ok) => servidor.listen(0, '127.0.0.1', () => ok(servidor)));
}

async function aJpeg(pagina, png, nombre, recorte) {
  const datos = await pagina.evaluate(
    async ({ b64, ancho, calidad, recorte }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const r = recorte ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
      const escala = Math.min(1, ancho / r.w);
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(r.w * escala);
      lienzo.height = Math.round(r.h * escala);
      const ctx = lienzo.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, lienzo.width, lienzo.height);
      return lienzo.toDataURL('image/jpeg', calidad).split(',')[1];
    },
    { b64: png.toString('base64'), ancho: ANCHO_MAXIMO, calidad: CALIDAD_JPEG, recorte },
  );
  writeFileSync(join(CAPTURAS, `${nombre}.jpg`), Buffer.from(datos, 'base64'));
  process.stdout.write(`captura ${nombre}\n`);
}

// Capturas de la SPA (PNG a 2x, ventana de 1280 × 800 o 360 × 740) que usa index.html. Se toman con
// el sistema levantado, el seed y los datos de los e2e; algunas simulan respuestas del API (lo dice su
// pie en el PDF). Un recorte [x, y, ancho, alto] en píxeles de la captura genera `<nombre>-resultado`.
const RESULTADO_VERIFICACION = [701, 471, 1342, 175];
const SPA = [
  ['01-ingreso-escritorio'],
  ['01-ingreso-360'],
  ['02-inicio-personal-escritorio'],
  ['03-pagos-filtrado-desde-panel-escritorio'],
  ['04-pagos-leyenda-abierta-escritorio'],
  ['formulario-pago'],
  ['dialogo-validar'],
  ['dialogo-rechazar'],
  ['06-polizas-iconos-escritorio'],
  ['07-recibos-escritorio'],
  ['10-verificacion-valido', RESULTADO_VERIFICACION],
  ['10-verificacion-hash_inconsistente', RESULTADO_VERIFICACION],
  ['10-verificacion-no_anclado', RESULTADO_VERIFICACION],
  ['10-verificacion-anulado', RESULTADO_VERIFICACION],
  ['10-verificacion-no_encontrado', RESULTADO_VERIFICACION],
  ['recibo-detalle'],
  ['09-inicio-admin-escritorio'],
  ['usuarios'],
  ['usuario-nuevo'],
  ['bitacora'],
  ['aseguradoras'],
  ['11-portal-360'],
  ['12-portal-en-mora-360'],
  ['13-portal-vacio-360'],
  ['portal-pagos-360'],
];
async function importarSpa(pagina, carpeta) {
  const disponibles = new Set(readdirSync(carpeta));
  for (const [nombre, recorte] of SPA) {
    if (!disponibles.has(`${nombre}.png`)) throw new Error(`Falta ${nombre}.png en ${carpeta}`);
    const [x, y, w, h] = recorte ?? [];
    await aJpeg(
      pagina,
      readFileSync(join(carpeta, `${nombre}.png`)),
      `spa-${nombre}${recorte ? '-resultado' : ''}`,
      recorte && { x, y, w, h },
    );
  }
}

// Pantallas de sprints futuros, tomadas del prototipo. `p` es window.__proto.
const PROTOTIPO = [
  [
    'cargar',
    (p) => {
      p.setRole('staff');
      Object.assign(p.UI.carga, { step: 'preview', file: 'cobros-sweaden-octubre.xlsx' });
      p.go('cargar');
    },
  ],
  [
    'mesa-notificacion',
    (p) => {
      p.setRole('staff');
      p.go('validar', p.D.pays.find((x) => x.deb && x.estado === 'por').id);
    },
  ],
  [
    'mesa-comprobante',
    (p) => {
      p.setRole('staff');
      p.go('validar', 'p1');
      p.UI.rej = { open: true, chip: 'La referencia no corresponde' };
      p.render();
    },
  ],
  [
    'cartera',
    (p) => {
      p.setRole('staff');
      p.go('cartera');
    },
  ],
  [
    'ficha-cliente',
    (p) => {
      p.setRole('staff');
      p.go('cliente', 'María Fernanda Guamán');
    },
  ],
  [
    'recibo-anclaje',
    (p) => {
      p.setRole('staff');
      p.go('recibo', p.D.pays.find((x) => x.rec && !x.anc).rec);
    },
  ],
  [
    'segundo-factor',
    (p) => {
      p.setRole('login');
      p.UI.totp = 'diego.andrade@oasisseguros.ec';
      p.render();
    },
  ],
  [
    'admin-inicio',
    (p) => {
      p.setRole('admin');
    },
  ],
  [
    'admin-usuarios',
    (p) => {
      p.setRole('admin');
      p.UI.adm = 'usuarios';
      p.go('admin');
    },
  ],
  [
    'admin-usuario-nuevo',
    (p) => {
      p.setRole('admin');
      p.UI.adm = 'usuarios';
      p.go('admin');
      p.UI.newUser = true;
      p.render();
    },
  ],
  [
    'admin-anclaje',
    (p) => {
      p.setRole('admin');
      p.UI.adm = 'anclaje';
      p.go('admin');
    },
  ],
  [
    'recibo-fallido',
    (p) => {
      p.setRole('admin');
      p.go('recibo', p.D.pays.find((x) => x.anc === 'fall').rec);
    },
  ],
  [
    'recibo-anular',
    (p) => {
      p.setRole('admin');
      p.go('recibo', p.D.pays.find((x) => x.rec && !x.anc).rec);
      p.UI.anular = true;
      p.render();
    },
  ],
  [
    'admin-catalogos',
    (p) => {
      p.setRole('admin');
      p.UI.adm = 'catalogos';
      p.go('admin');
    },
  ],
  [
    'admin-seguridad',
    (p) => {
      p.setRole('admin');
      p.UI.adm = 'seguridad';
      p.go('admin');
    },
  ],
  [
    'reporte-conciliacion',
    (p) => {
      p.setRole('admin');
      p.UI.rp = 'conc';
      p.go('reportes');
    },
  ],
  [
    'reporte-cartera',
    (p) => {
      p.setRole('admin');
      p.UI.rp = 'cart';
      p.go('reportes');
    },
  ],
  [
    'tel-datos',
    (p) => {
      p.D.consent = false;
      p.setRole('client');
    },
    true,
  ],
  [
    'tel-poliza',
    (p) => {
      p.D.consent = true;
      p.setRole('client');
      p.mGo('poliza', 'vida');
    },
    true,
  ],
  [
    'tel-reportar',
    (p) => {
      p.D.consent = true;
      p.setRole('client');
      p.mGo('reportar', 'vida');
    },
    true,
  ],
  [
    'tel-recibo',
    (p) => {
      p.D.consent = true;
      p.setRole('client');
      p.mGo('recibo', p.D.pays.find((x) => x.mine && x.rec && !x.anc).rec);
    },
    true,
  ],
  [
    'tel-verificar',
    (p) => {
      p.D.consent = true;
      p.setRole('client');
      p.UI.verify = p.D.pays.find((x) => x.mine && x.rec && !x.anc).rec;
      p.mGo('verificar');
    },
    true,
  ],
];
// Sin la barra del prototipo ni el marco del teléfono: el PDF dibuja el suyo para todas las capturas.
const SIN_MARCO =
  '.pbar,.toast,.guide,.notch{display:none!important}.rail{top:0!important;height:100vh!important}.staff{min-height:100vh!important}' +
  '.phone{border:0!important;border-radius:0!important;box-shadow:none!important}';
async function capturarPrototipo(navegador, base, conversor) {
  const ctx = await navegador.newContext({
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    locale: 'es-EC',
  });
  const pagina = await ctx.newPage();
  const fuentes = `@font-face{font-family:Figtree;font-weight:300 900;src:url(${base}/apps/web/node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2)}@font-face{font-family:Outfit;font-weight:100 900;src:url(${base}/apps/web/node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2)}`;
  await pagina.route(/fonts\.googleapis\.com/, (r) =>
    r.fulfill({ contentType: 'text/css', body: fuentes }),
  );
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  for (const [nombre, preparar, telefono] of PROTOTIPO) {
    await pagina.goto(`${base}/docs/diseno/prototipo/index.html`);
    await pagina.addStyleTag({ content: SIN_MARCO });
    await pagina.evaluate(`(${preparar.toString()})(window.__proto)`);
    await pagina.evaluate(() => document.fonts.ready);
    await pagina.waitForTimeout(500);
    await pagina.evaluate(() => window.scrollTo(0, 0));
    const png = telefono
      ? await pagina.locator('.phone .scr').screenshot()
      : await pagina.screenshot({ clip: { x: 0, y: 0, width: 1280, height: 800 } });
    await aJpeg(conversor, png, `proto-${nombre}`);
  }
  await ctx.close();
  if (errores.length) throw new Error(`Errores del prototipo:\n${errores.join('\n')}`);
}

const args = process.argv.slice(2);
const servidor = await servir();
const base = `http://127.0.0.1:${servidor.address().port}`;
const navegador = await chromium.launch();
try {
  const conversor = await navegador.newPage();
  const spa = args.indexOf('--spa');
  if (spa !== -1) await importarSpa(conversor, args[spa + 1]);
  if (args.includes('--prototipo')) await capturarPrototipo(navegador, base, conversor);

  const pagina = await navegador.newPage();
  const faltantes = [];
  pagina.on('response', (r) => r.status() === 404 && faltantes.push(r.url()));
  await pagina.goto(`${base}/docs/diseno/pdf/index.html`, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  if (faltantes.length) throw new Error(`Recursos que no existen:\n${faltantes.join('\n')}`);
  const desbordes = await pagina.evaluate(() =>
    [...document.querySelectorAll('.hoja')].flatMap((h, i) =>
      [h, ...h.querySelectorAll('.cuerpo')].some(
        (n) => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1,
      )
        ? [i + 1]
        : [],
    ),
  );
  if (desbordes.length) throw new Error(`Páginas que desbordan: ${desbordes.join(', ')}`);
  await pagina.pdf({ path: SALIDA, preferCSSPageSize: true, printBackground: true });
  const hojas = await pagina.locator('.hoja').count();
  process.stdout.write(
    `PDF: ${SALIDA} · ${hojas} páginas · ${(statSync(SALIDA).size / 1048576).toFixed(2)} MB\n`,
  );
} finally {
  await navegador.close();
  servidor.close();
}
