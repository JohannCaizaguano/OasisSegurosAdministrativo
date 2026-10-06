// Utilidades de los escenarios k6. Los límites del API son de seguridad: la
// cadencia se calcula para no superarlos o se suben antes (docs/despliegue.md).
import http from 'k6/http';

export const LIMITE_POR_DEFECTO = {
  global: 100,
  login: 5,
  refresh: 20,
};

/**
 * Límite vigente en el servidor, leído de las variables de entorno de k6 (con
 * `-e`) o del valor por defecto. Sirve para calcular cadencias coherentes.
 */
export function limite(nombre) {
  const clave = `THROTTLE_${nombre.toUpperCase()}_LIMIT`;
  const valor = Number(__ENV[clave]);
  return Number.isFinite(valor) && valor > 0 ? valor : LIMITE_POR_DEFECTO[nombre];
}

/**
 * Credenciales de prueba. Sin `-e EMAIL` / `-e PASSWORD` el script aborta: los
 * valores del seed pueden estar sobrescritos y un 401 masivo parecería un
 * problema de rendimiento.
 */
export function credenciales() {
  const email = __ENV.EMAIL;
  const password = __ENV.PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Faltan EMAIL y PASSWORD. Ejecuta k6 con -e EMAIL=... -e PASSWORD=... ' +
        '(ver docs/despliegue.md, "Día de evaluación").',
    );
  }
  return { email, password };
}

/** Inicia sesión y devuelve el access token, la cookie de refresh y las cabeceras. */
export function iniciarSesion(baseUrl) {
  const { email, password } = credenciales();
  const respuesta = http.post(`${baseUrl}/api/v1/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
  });
  const token = respuesta.json('accessToken');
  if (!token) {
    throw new Error(`El login devolvió ${respuesta.status}: ${respuesta.body}`);
  }
  return {
    token,
    cookieRefresh: extraerCookieRefresh(respuesta),
    cabeceras: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  };
}

/** Extrae la cookie `oasis_refresh` de los `set-cookie` de la respuesta. */
export function extraerCookieRefresh(respuesta) {
  const cabeceras = respuesta.headers['Set-Cookie'] || [];
  for (const cabecera of cabeceras) {
    const coincide = /oasis_refresh=([^;]+)/.exec(cabecera);
    if (coincide) {
      return coincide[1];
    }
  }
  return null;
}

/**
 * Rota el refresh token con la cookie httpOnly, igual que haría el navegador.
 * Devuelve la respuesta completa para poder asertar sobre ella.
 */
export function refrescarSesion(baseUrl, cookieRefresh) {
  if (!cookieRefresh) {
    return { status: 0, body: 'sin cookie de refresh' };
  }
  return http.post(`${baseUrl}/api/v1/auth/refresh`, null, {
    headers: { Cookie: `oasis_refresh=${cookieRefresh}`, Origin: baseUrl },
  });
}
