// Escenario k6: verificación pública de recibos (sin autenticación).
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    verificacion_publica: { executor: 'constant-vus', vus: 30, duration: '45s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<700'],
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
  const listado = http.get(`${BASE_URL}/api/v1/recibos?page=1&pageSize=10`, {
    headers: { Authorization: `Bearer ${login.json('accessToken')}` },
  });
  const codigos = (listado.json('data') || []).map((r) => r.codigo);
  return { codigos };
}

export default function (datos) {
  const codigo = datos.codigos[Math.floor(Math.random() * datos.codigos.length)] || 'RC-NOEXISTE';
  const respuesta = http.get(`${BASE_URL}/api/v1/public/recibos/${codigo}/verificacion`);

  check(respuesta, {
    'verificación 200': (r) => r.status === 200,
    'sin datos personales': (r) => !JSON.stringify(r.json()).includes('@'),
    'estado conocido': (r) =>
      ['VALIDO', 'ANULADO', 'NO_ANCLADO', 'NO_ENCONTRADO', 'HASH_INCONSISTENTE'].includes(
        r.json('estado'),
      ),
  });

  sleep(0.5);
}
