// Escenario k6: inicio de sesión de operadores.
// Uso: k6 run -e BASE_URL=https://dominio infra/k6/login.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const EMAIL = __ENV.EMAIL || 'operador@oasis.com';
const PASSWORD = __ENV.PASSWORD || 'Operador.Oasis1';

export const options = {
  scenarios: {
    login: { executor: 'constant-vus', vus: 10, duration: '30s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const respuesta = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(respuesta, {
    'login 200': (r) => r.status === 200,
    'devuelve accessToken': (r) => typeof r.json('accessToken') === 'string',
  });

  sleep(1);
}
