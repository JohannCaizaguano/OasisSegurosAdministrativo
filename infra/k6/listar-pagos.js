// Escenario k6: listado de pagos autenticado (lectura típica de operador).
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    listar_pagos: { executor: 'constant-vus', vus: 20, duration: '45s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export function setup() {
  const login = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: __ENV.EMAIL || 'operador@oasis.com',
      password: __ENV.PASSWORD || 'Operador.Oasis1',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return { token: login.json('accessToken') };
}

export default function (datos) {
  const respuesta = http.get(`${BASE_URL}/api/v1/pagos?page=1&pageSize=20`, {
    headers: { Authorization: `Bearer ${datos.token}` },
  });

  check(respuesta, {
    'pagos 200': (r) => r.status === 200,
    'respuesta paginada': (r) => Array.isArray(r.json('data')) && r.json('meta.total') >= 0,
  });

  sleep(1);
}
