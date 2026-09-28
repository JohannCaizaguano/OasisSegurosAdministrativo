#!/usr/bin/env bash
# Respaldo diario de PostgreSQL: pg_dump comprimido + rotación de 7 días.
# Uso: ./backup-db.sh [directorio_destino]
set -euo pipefail

DESTINO="${1:-/opt/oasis/backups}"
RETENCION_DIAS=7
COMPOSE_DIR="${COMPOSE_DIR:-/opt/oasis}"

mkdir -p "${DESTINO}"
FECHA="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVO="${DESTINO}/oasis-${FECHA}.sql.gz"

echo "[backup] Generando ${ARCHIVO}"
cd "${COMPOSE_DIR}"
docker compose -f compose.prod.yaml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists' \
  | gzip -9 > "${ARCHIVO}"

echo "[backup] Rotando respaldos de más de ${RETENCION_DIAS} días"
find "${DESTINO}" -name 'oasis-*.sql.gz' -mtime "+${RETENCION_DIAS}" -delete

# Copia fuera del servidor (opcional): configure RCLONE_REMOTE y descomente.
# rclone copy "${ARCHIVO}" "${RCLONE_REMOTE}:oasis-backups"

echo "[backup] Listo: $(du -h "${ARCHIVO}" | cut -f1)"
