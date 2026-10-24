# ADR-026 · Respaldos cifrados con restic en almacenamiento externo

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S7

## Contexto

HT-06 pide un respaldo diario con `pg_dump` rotado 7 días y, además, respaldos cifrados con restic
en un almacenamiento externo compatible con S3, conservados 30 días, con la restauración del
respaldo cifrado probada en un entorno limpio. Un respaldo en el mismo VPS no protege ante la
pérdida del servidor.

## Decisión

- **Dos niveles.** `backup-db.sh` deja un volcado local de 7 días (restauración rápida) y
  `backup-restic.sh` envía `pg_dump -Fc` y el volumen de comprobantes (ADR-025) a Backblaze B2 por
  su API S3, cifrados por restic.
- **Retención y verificación:** `restic forget --keep-daily 30 --prune` diario y `restic check`
  semanal, con timers de systemd a las 03:00.
- **Secretos** de restic y de B2 en `/etc/oasis/restic.env` (permisos 600), fuera del repositorio y
  de los contenedores; la contraseña de restic también se guarda fuera del servidor (sin ella el
  respaldo es irrecuperable).
- **Restauración probada** con `restore-restic.sh` en un contenedor PostgreSQL nuevo, comparando los
  conteos por tabla con el origen; se repite tras cada cambio de esquema importante.

## Alternativas descartadas

- **Almacenamiento del mismo proveedor del VPS:** una incidencia de la cuenta afectaría servidor y
  respaldos a la vez.
- **Cloudflare R2:** equivalente; se eligió B2 por su capa gratuita y su soporte en restic.

## Consecuencias

- Positivas: la pérdida del VPS no pierde datos de más de un día; los respaldos externos no se leen
  sin la contraseña de restic.
- Negativas: un encargado más en el registro de tratamiento (HT-16); perder la contraseña de restic
  invalida los respaldos externos.
