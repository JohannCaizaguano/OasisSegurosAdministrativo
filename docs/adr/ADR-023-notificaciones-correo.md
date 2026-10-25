# ADR-023 · Notificaciones por correo desde el worker

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S6

## Contexto

HT-12 pide un servicio de correo con adaptador SMTP (Nodemailer), envío desde una cola con
reintentos e identidad visual de Oasis. Lo usan HU-05 (cuenta creada, con la contraseña temporal),
HU-39 (validación y rechazo), HU-31 (recuperación),
HU-52 (avisos de seguridad), HU-40 (recordatorios) y HU-47 (cambio de correo). Ningún envío debe
retrasar la respuesta al usuario.

## Decisión

- **Cola `notificaciones`.** El API encola `{ plantilla, para, datos }` después del commit; el worker
  renderiza y envía con concurrencia 5, 5 intentos y espera exponencial desde 30 s. Si encolar
  falla, se registra el error y la respuesta sigue siendo exitosa.
- **Puerto y adaptador.** `NotificacionesPort` con un adaptador Nodemailer SMTP; las credenciales
  (`SMTP_*`) y `APP_PUBLIC_URL` existen solo en el entorno del worker.
- **Plantillas** como funciones puras que devuelven asunto, HTML con estilos en línea y texto plano,
  con escape de todos los valores y el isologo servido desde la SPA.
- **Proveedores.** Mailpit en desarrollo; Brevo por SMTP en producción, con SPF, DKIM y DMARC. El
  código no depende del proveedor.

## Alternativas descartadas

- **Enviar dentro de la petición:** un SMTP lento o caído retrasaría o rompería la validación.
- **API HTTP del proveedor:** ata el código a un proveedor; SMTP es estándar.

## Consecuencias

- Positivas: los correos sobreviven a caídas breves del SMTP; cambiar de proveedor es cambiar
  variables.
- Negativas: el correo del destinatario pasa por Redis mientras el trabajo vive (se eliminan al
  completarse y los fallidos a los 7 días); un correo perdido tras 5 intentos solo queda en los
  logs.
