// Escenario k6: login de operadores. `POST /auth/login` limita a 5/min, así que
// la cadencia se calcula desde el límite vigente (docs/despliegue.md).
// Uso: k6 run -e BASE_URL=https://dominio -e EMAIL=... -e PASSWORD=... infra/k6/login.js
import http from 'k6/http';
import { check, sleep } from 'k6';

import { credenciales, limite } from './lib.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const { email, password } = credenciales();
const LIMITE = limite('login');

// Objetivo: 80 % del límite durante la medición, para no medir el limitador.
const ITERACIONES_POR_MINUTO = Math.max(1, Math.floor(LIMITE * 0.8));
const VUS = Math.min(5, ITERACIONES_POR_MINUTO);
const ESPERA_SEGUNDOS = Math.round((60 * VUS) / ITERACIONES_POR_MINUTO);

export const options = {
  scenarios: {
    login: { executor: 'constant-vus', vus: VUS, duration: '30s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.98'],
  },
};

export default function () {
  const respuesta = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json', Origin: BASE_URL } },
  );

  check(respuesta, {
    'login 200': (r) => r.status === 200,
    'devuelve accessToken': (r) => typeof r.json('accessToken') === 'string',
    'devuelve refresh en cookie httpOnly': (r) =>
      (r.headers['Set-Cookie'] || []).some((c) => /oasis_refresh=/.test(c) && /HttpOnly/i.test(c)),
    'cookie con SameSite=Strict': (r) =>
      (r.headers['Set-Cookie'] || []).some(
        (c) => /oasis_refresh=/.test(c) && /SameSite=Strict/i.test(c),
      ),
    'no expone la contraseña': (r) => !r.body.includes(password),
  });

  sleep(ESPERA_SEGUNDOS);
}
