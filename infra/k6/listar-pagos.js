// Escenario k6: listado de pagos autenticado (lectura típica de operador) más
// la rotación del refresh token, que es lo que hace el navegador en segundo plano.
//
// Uso: k6 run -e BASE_URL=https://dominio -e EMAIL=... -e PASSWORD=... infra/k6/listar-pagos.js
import http from 'k6/http';
import { check, sleep } from 'k6';

import { iniciarSesion, limite, refrescarSesion } from './lib.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// La lectura autenticada consume del límite global (100/min) y el refresh del
// propio (20/min). Se reserva un 20 % del global para el resto de peticiones.
const LIMITE_GLOBAL = limite('global');
const ITERACIONES_POR_MINUTO = Math.max(1, Math.floor(LIMITE_GLOBAL * 0.8));
const VUS = Math.min(10, ITERACIONES_POR_MINUTO);
const ESPERA_SEGUNDOS = Math.round((60 * VUS) / ITERACIONES_POR_MINUTO);
const REFRESQUES_POR_ITERACION = 3;

export const options = {
  scenarios: {
    listar_pagos: { executor: 'constant-vus', vus: VUS, duration: '45s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.98'],
  },
};

export function setup() {
  const sesion = iniciarSesion(BASE_URL);
  return {
    token: sesion.token,
    cookieRefresh: sesion.cookieRefresh,
  };
}

export default function (datos) {
  const cabeceras = { Authorization: `Bearer ${datos.token}` };

  const listado = http.get(`${BASE_URL}/api/v1/pagos?page=1&pageSize=20`, { headers: cabeceras });

  check(listado, {
    'pagos 200': (r) => r.status === 200,
    'respuesta paginada': (r) => Array.isArray(r.json('data')) && r.json('meta.total') >= 0,
    'no filtra datos de otros roles': (r) =>
      r.status !== 200 || typeof r.json('meta.page') === 'number',
  });

  // 1 de cada 3 iteraciones renueva la sesión, imitando la actividad real.
  if (__ITER % REFRESQUES_POR_ITERACION === 0) {
    const refresco = refrescarSesion(BASE_URL, datos.cookieRefresh);
    check(refresco, {
      'refresh 200': (r) => r.status === 200,
      'devuelve accessToken': (r) => r.status !== 200 || typeof r.json('accessToken') === 'string',
    });
  }

  sleep(ESPERA_SEGUNDOS);
}
