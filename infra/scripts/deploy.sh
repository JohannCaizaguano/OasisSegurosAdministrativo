#!/usr/bin/env bash
# Despliegue manual (alternativa a GitHub Actions) en el VPS.
# Uso: ./deploy.sh <tag>
set -euo pipefail

TAG="${1:?Uso: deploy.sh <tag de las imágenes>}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/oasis}"

cd "${COMPOSE_DIR}"

echo "[deploy] Fijando OASIS_TAG=${TAG}"
if grep -q '^OASIS_TAG=' .env; then
  sed -i "s/^OASIS_TAG=.*/OASIS_TAG=${TAG}/" .env
else
  echo "OASIS_TAG=${TAG}" >> .env
fi

echo "[deploy] Descargando imágenes"
docker compose -f compose.prod.yaml pull

echo "[deploy] Migrando la base de datos"
docker compose -f compose.prod.yaml run --rm migrate

echo "[deploy] Levantando servicios"
docker compose -f compose.prod.yaml up -d

echo "[deploy] Smoke test"
DOMINIO="$(grep '^DOMAIN=' .env | cut -d= -f2)"
for i in $(seq 1 12); do
  if curl -fsS "https://${DOMINIO}/api/v1/health" | grep -q '"status":"ok"'; then
    echo "[deploy] OK en el intento ${i}"
    exit 0
  fi
  sleep 5
done

echo "[deploy] El smoke test falló; revise docker compose logs" >&2
exit 1
