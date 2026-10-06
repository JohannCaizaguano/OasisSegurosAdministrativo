// Escenario k6: verificación de recibos con sesión (ADR-015). Hasta S8 rige el límite global por
// IP; la cadencia se calcula desde él.
//
// Uso: k6 run -e BASE_URL=https://dominio -e EMAIL=... -e PASSWORD=... infra/k6/verificacion-recibo.js
import http from 'k6/http';
import { check, sleep } from 'k6';

import { iniciarSesion, limite } from './lib.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const LIMITE = limite('global');
const ITERACIONES_POR_MINUTO = Math.max(1, Math.floor(LIMITE * 0.8));
const VUS = Math.min(10, ITERACIONES_POR_MINUTO);
const ESPERA_SEGUNDOS = Math.round((60 * VUS) / ITERACIONES_POR_MINUTO);

const ESTADOS_VALIDOS = ['VALIDO', 'ANULADO', 'NO_ANCLADO', 'NO_ENCONTRADO', 'HASH_INCONSISTENTE'];

export const options = {
  scenarios: {
    verificacion_recibo: { executor: 'constant-vus', vus: VUS, duration: '45s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<700'],
    checks: ['rate>0.98'],
  },
};

export function setup() {
  const sesion = iniciarSesion(BASE_URL);
  const listado = http.get(`${BASE_URL}/api/v1/recibos?page=1&pageSize=10`, {
    headers: sesion.cabeceras,
  });
  const codigos = (listado.json('data') || []).map((r) => r.codigo);
  if (codigos.length === 0) {
    throw new Error('No hay recibos para verificar; ejecuta el flujo completo antes.');
  }
  return { codigos, cabeceras: sesion.cabeceras };
}

export default function (datos) {
  const codigo = datos.codigos[__ITER % datos.codigos.length];
  const respuesta = http.get(`${BASE_URL}/api/v1/recibos/${codigo}/verificacion`, {
    headers: datos.cabeceras,
  });

  check(respuesta, {
    'verificación 200': (r) => r.status === 200,
    'estado conocido': (r) => ESTADOS_VALIDOS.includes(r.json('estado')),
    'no filtra datos personales': (r) => !/[@"]nombre|identificacion|apellidos/.test(r.body),
    'no expone la sal ni el payload': (r) => !/"sal"|"payloadCanonico"/.test(r.body),
    'devuelve hash recalculado': (r) => /^0x[0-9a-f]{64}$/i.test(r.json('hashRecibo') || ''),
  });

  sleep(ESPERA_SEGUNDOS);
}
