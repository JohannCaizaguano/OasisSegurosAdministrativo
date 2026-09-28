#!/usr/bin/env bash
# Restaura un respaldo generado por backup-db.sh.
# Uso: ./restore-db.sh /opt/oasis/backups/oasis-20260928T031500Z.sql.gz
set -euo pipefail

ARCHIVO="${1:?Uso: restore-db.sh <archivo.sql.gz>}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/oasis}"

if [ ! -f "${ARCHIVO}" ]; then
  echo "No existe el archivo ${ARCHIVO}" >&2
  exit 1
fi

echo "ATENCIÓN: esto reemplaza la base de datos de producción."
read -r -p "Escriba 'restaurar' para continuar: " CONFIRMACION
[ "${CONFIRMACION}" = "restaurar" ] || { echo "Cancelado"; exit 1; }

cd "${COMPOSE_DIR}"
echo "[restore] Deteniendo API/worker para evitar escrituras..."
docker compose -f compose.prod.yaml stop api worker

echo "[restore] Restaurando ${ARCHIVO}"
gunzip -c "${ARCHIVO}" | docker compose -f compose.prod.yaml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'

echo "[restore] Aplicando migraciones pendientes y reiniciando servicios"
docker compose -f compose.prod.yaml run --rm migrate
docker compose -f compose.prod.yaml start api worker

echo "[restore] Verifique: curl -fsS https://\$DOMAIN/api/v1/health"
