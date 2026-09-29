// Escenario k6: validar un pago (emite recibo y transacción real en la cadena).
// Uso: k6 run -e BASE_URL=https://dominio -e EMAIL=... -e PASSWORD=... infra/k6/validar-pago.js
import http from 'k6/http';
import { check, sleep } from 'k6';

import { iniciarSesion, limite } from './lib.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const LIMITE_GLOBAL = limite('global');
// 3 peticiones por iteración: se reserva margen para el resto de la prueba.
const ITERACIONES_POR_MINUTO = Math.max(1, Math.floor((LIMITE_GLOBAL * 0.5) / 3));

export const options = {
  scenarios: {
    validar_pago: {
      executor: 'constant-arrival-rate',
      rate: ITERACIONES_POR_MINUTO,
      timeUnit: '1m',
      duration: '1m',
      preAllocatedVUs: 2,
      maxVUs: 10,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.98'],
  },
};

export function setup() {
  const sesion = iniciarSesion(BASE_URL);
  const polizas = http.get(`${BASE_URL}/api/v1/polizas?page=1&pageSize=1`, {
    headers: { Authorization: `Bearer ${sesion.token}` },
  });
  const polizaId = polizas.json('data.0.id');
  if (!polizaId) {
    throw new Error('No hay pólizas; ejecuta el seed antes de este escenario.');
  }
  return { token: sesion.token, polizaId };
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

  check(pago, { 'pago creado 201': (r) => r.status === 201 });

  if (pago.status !== 201) {
    return;
  }

  // `confirmado: true` es obligatorio desde que la validación exige una
  // confirmación explícita en la interfaz.
  const validar = http.patch(
    `${BASE_URL}/api/v1/pagos/${pago.json('id')}/validar`,
    JSON.stringify({ confirmado: true, nota: `k6-${__VU}-${__ITER}` }),
    { headers: cabeceras },
  );

  check(validar, {
    'validación 200': (r) => r.status === 200,
    'recibo PENDIENTE_ANCLAJE': (r) => r.json('recibo.estado') === 'PENDIENTE_ANCLAJE',
    'recibo con idOnchain y hash': (r) =>
      /^0x[0-9a-f]{64}$/i.test(r.json('recibo.idOnchain') || '') &&
      /^0x[0-9a-f]{64}$/i.test(r.json('recibo.hashRecibo') || ''),
    'no devuelve el uuid del pago como id onchain': (r) =>
      r.json('recibo.idOnchain') !== r.json('pago.id'),
  });

  sleep(1);
}
