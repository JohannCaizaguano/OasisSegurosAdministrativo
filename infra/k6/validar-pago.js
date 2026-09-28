// Escenario k6: validar un pago (crea el recibo y dispara el anclaje).
// Ritmo moderado: 1 iteración cada 2 s durante 1 minuto.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    validar_pago: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '2s',
      duration: '1m',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
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
  const token = login.json('accessToken');

  const polizas = http.get(`${BASE_URL}/api/v1/polizas?page=1&pageSize=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { token, polizaId: polizas.json('data.0.id') };
}

export default function (datos) {
  const cabeceras = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${datos.token}`,
  };

  const pago = http.post(
    `${BASE_URL}/api/v1/pagos`,
    JSON.stringify({
      polizaId: datos.polizaId,
      monto: '25.00',
      fechaPago: new Date().toISOString().slice(0, 10),
      metodo: 'TRANSFERENCIA',
      referencia: `K6-${__VU}-${__ITER}-${Date.now()}`,
    }),
    { headers: cabeceras },
  );

  check(pago, { 'pago creado': (r) => r.status === 201 });

  if (pago.status === 201) {
    const validar = http.patch(`${BASE_URL}/api/v1/pagos/${pago.json('id')}/validar`, null, {
      headers: cabeceras,
    });
    check(validar, {
      'validación 200': (r) => r.status === 200,
      'recibo PENDIENTE_ANCLAJE': (r) => r.json('recibo.estado') === 'PENDIENTE_ANCLAJE',
    });
  }

  sleep(1);
}
