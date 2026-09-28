// Escenario k6: inicio de sesión de operadores.
// Uso: k6 run -e BASE_URL=https://dominio -e EMAIL=... -e PASSWORD=... infra/k6/login.js
//
// `POST /auth/login` está limitado a 5/min por IP (protección contra fuerza
// bruta). Con 10 VU sin espera se generarían ~300 logins en 30 s, el 98 % con
// 429 y el escenario fallaría sin que el rendimiento del API tenga nada que ver.
// Por eso la cadencia se calcula a partir del límite vigente; para medir por
// encima hay que subir antes THROTTLE_LOGIN_LIMIT en el servidor y pasarlo
// también a k6 con `-e THROTTLE_LOGIN_LIMIT=<valor>`.
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
