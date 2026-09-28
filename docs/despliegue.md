# Despliegue en producción (OVHcloud VPS-1 · Ubuntu 24.04)

Guía completa para poner el sistema en línea con TLS, backups y anclaje real en Amoy.

## 0. Requisitos

- VPS-1 (4 vCPU / 8 GB) con Ubuntu 24.04, IP pública y acceso root por SSH.
- Dominio propio (por ejemplo `oasis.example.com`).
- Cuenta en GitHub con permisos sobre el paquete (GHCR) y un PAT `read:packages`.
- Cuenta de Etherscan (API key V2) para verificar el contrato.
- Fondos de prueba del **faucet de Amoy** para la cuenta desplegadora.

## 1. Aprovisionamiento

```bash
scp infra/scripts/bootstrap-vps.sh root@<IP_VPS>:/root/
ssh root@<IP_VPS> 'bash /root/bootstrap-vps.sh'
```

El script crea el usuario `deploy`, endurece SSH (sin root, sin contraseña), configura
`ufw` (22/80/443), `fail2ban`, `unattended-upgrades`, Docker Engine + compose plugin y
`/opt/oasis`. **Antes de cerrar la sesión root**, verifique el acceso por clave con
`deploy` y luego deshabilite el login de root.

## 2. DNS y certificado

1. Cree el registro **A** `oasis.example.com → IP del VPS`.
2. No hace falta configurar TLS: Caddy solicita el certificado automáticamente en el
   primer arranque (puertos 80/443 abiertos).

## 3. Archivos en el VPS

```bash
ssh deploy@<IP_VPS>
sudo mkdir -p /opt/oasis && sudo chown deploy:deploy /opt/oasis
# copiar compose.prod.yaml, compose.monitoring.yaml e infra/ (scp o rsync)
install -m 600 /dev/null /opt/oasis/.env   # y editar
```

`.env` de producción (mínimo):

```ini
NODE_ENV=production
DOMAIN=oasis.example.com
POSTGRES_USER=oasis
POSTGRES_PASSWORD=<secreto-largo>
POSTGRES_DB=oasis
# Dentro de Docker los hosts son los nombres de servicio:
DATABASE_URL=postgresql://oasis:<secreto>@postgres:5432/oasis?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
CHAIN_ID=80002
RPC_URL=https://rpc-amoy.polygon.technology
RPC_URL_FALLBACK=<proveedor alternativo opcional>
CONTRACT_ADDRESS=<se completa tras el despliegue del contrato>
MAX_FEE_PER_GAS_GWEI=50
EXPLORER_BASE_URL=https://amoy.polygonscan.com
# Imágenes publicadas por GitHub Actions:
OASIS_API_IMAGE=ghcr.io/<usuario>/oasis-api
OASIS_MIGRATOR_IMAGE=ghcr.io/<usuario>/oasis-api-migrator
OASIS_WEB_IMAGE=ghcr.io/<usuario>/oasis-web
OASIS_TAG=1.0.0
GRAFANA_ADMIN_PASSWORD=<secreto>
```

`.env.worker` de producción (archivo separado, `chmod 600`):

```ini
# Clave de la cuenta operadora (REGISTRADOR_ROLE). Solo la inyecta el worker.
OPERATOR_PRIVATE_KEY=<clave de la cuenta operadora>
```

```bash
install -m 600 /dev/null /opt/oasis/.env.worker   # y editar
echo <PAT> | docker login ghcr.io -u <usuario> --password-stdin
cd /opt/oasis && docker compose -f compose.prod.yaml up -d
```

`compose.prod.yaml` carga `.env.worker` únicamente en el servicio `worker`, así que
`docker inspect` del contenedor `api` no muestra la clave (ADR 0004). Verifíquelo:

```bash
docker inspect oasis-api-1 --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | grep -c OPERATOR_PRIVATE_KEY   # debe imprimir 0
docker inspect oasis-worker-1 --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | grep -c OPERATOR_PRIVATE_KEY   # debe imprimir 1
```

El contenedor `migrate` aplica las migraciones y termina; `api` y `worker` esperan a que
complete. Verifique con el dominio del `.env`:

```bash
curl -fsS "https://$(grep '^DOMAIN=' /opt/oasis/.env | cut -d= -f2)/api/v1/health"
```

Datos iniciales (solo la primera vez):

```bash
docker compose -f compose.prod.yaml run --rm migrate \
  node node_modules/prisma/build/index.js db seed
```

## 4. Despliegue del contrato en Amoy

En la laptop del responsable (nunca en el VPS):

```bash
cd packages/contracts

# 1. Guardar la clave del desplegador cifrada con hardhat-keystore (nada en texto plano)
pnpm hardhat keystore set DEPLOYER_PRIVATE_KEY
pnpm hardhat keystore set AMOY_RPC_URL          # https://rpc-amoy.polygon.technology
pnpm hardhat keystore set ETHERSCAN_API_KEY

# 2. Fondear la cuenta desplegadora desde el faucet de Amoy
#    (https://faucet.polygon.technology)

# 3. Desplegar con Ignition
pnpm hardhat ignition deploy ignition/modules/RegistroRecibos.ts \
  --network amoy --parameters ignition/parameters/amoy.json

# 4. Verificar el contrato
pnpm hardhat verify --network amoy <DIRECCION_CONTRATO> <DIRECCION_ADMIN>

# 5. Otorgar REGISTRADOR_ROLE a la cuenta operadora
CONTRACT_ADDRESS=<direccion> OPERATOR_ADDRESS=<cuenta_operadora> \
  pnpm hardhat run scripts/grant-registrador.ts --network amoy
```

Anote en este documento (tabla de registros):

| Elemento                            | Valor                                              |
| ----------------------------------- | -------------------------------------------------- |
| Dirección del contrato              | _(completar)_                                      |
| Bloque de despliegue                | _(completar)_                                      |
| Cuenta admin (DEFAULT_ADMIN_ROLE)   | _(completar)_                                      |
| Cuenta operadora (REGISTRADOR_ROLE) | _(completar)_                                      |
| Enlace al explorador                | https://amoy.polygonscan.com/address/_(completar)_ |

Finalmente, copie `CONTRACT_ADDRESS` al `.env` del VPS y `OPERATOR_PRIVATE_KEY` a
`.env.worker` (ambos `chmod 600`), y ejecute
`docker compose -f compose.prod.yaml up -d`.

## 5. Backups

```bash
# Prueba manual
/opt/oasis/infra/scripts/backup-db.sh
# Restauración (al menos una vez antes de la evaluación)
/opt/oasis/infra/scripts/restore-db.sh /opt/oasis/backups/oasis-<fecha>.sql.gz
```

Cron diario sugerido (usuario `deploy`):

```cron
15 3 * * * /opt/oasis/infra/scripts/backup-db.sh >> /var/log/oasis-backup.log 2>&1
```

Rotación: 7 días. Configure además una copia fuera del servidor (descomente la línea de
`rclone`/`scp` en el script).

## 6. Actualizaciones

Automático (recomendado): cree el tag `vX.Y.Z`; GitHub Actions publica las imágenes,
despliega por SSH y ejecuta el smoke test.

Manual: `infra/scripts/deploy.sh <tag>`.

## 7. Día de la evaluación

### 7.1 Preparación

```bash
# 1. Levantar el stack de monitoreo (se combina con producción).
#    NO se crea la red a mano: compose.prod.yaml ya declara `oasis_internal`
#    como interna y no externa. Crearla por delante provoca un error de
#    etiquetas y compose se niega a arrancar.
docker compose -f compose.prod.yaml -f compose.monitoring.yaml up -d

# 2. Levantar el rate limiter para la medición.
#    Los valores por defecto son de seguridad (login 5/min, verificación
#    pública 20/min) y hacen que los escenarios midan el limitador. Se suben,
#    se reinicia el API y se anota el valor usado en el informe.
sed -i 's/^THROTTLE_.*=.*/# &/' .env
cat >> .env <<'LIMITES'
THROTTLE_GLOBAL_LIMIT=600
THROTTLE_LOGIN_LIMIT=120
THROTTLE_REFRESH_LIMIT=120
THROTTLE_VERIFICACION_PUBLICA_LIMIT=300
LIMITES
docker compose -f compose.prod.yaml up -d api
```

### 7.2 Escenarios de carga

Desde una máquina externa al VPS (el enunciado pide medir desde fuera):

```bash
export BASE_URL="https://$(grep '^DOMAIN=' /opt/oasis/.env | cut -d= -f2)"
export EMAIL='operador@oasis.com'
export PASSWORD='<la del seed>'

k6 run -e BASE_URL -e EMAIL -e PASSWORD infra/k6/login.js
k6 run -e BASE_URL -e EMAIL -e PASSWORD infra/k6/listar-pagos.js
k6 run -e BASE_URL -e EMAIL -e PASSWORD infra/k6/verificacion-publica.js
k6 run -e BASE_URL -e EMAIL -e PASSWORD infra/k6/validar-pago.js \
  --out json=resultados-validar-pago.json
```

Los escenarios calculan su cadencia a partir de los límites vigente
(`-e THROTTLE_LOGIN_LIMIT=...`, etc.). Si no se suben los límites en el servidor,
la cadencia se ajusta a los valores por defecto y la prueba no satura el
limitador.

`validar-pago.js` emite recibos reales: deja la base con varios pagos `VALIDADO`
y sus recibos `ANCLADO`. Es lo esperado tras la evaluación.

### 7.3 Exportar métricas

```bash
# Grafana: el puerto está enlazado solo a loopback del host, así que el túnel
# apunta al puerto del host (3001), no al del contenedor.
ssh -L 3001:localhost:3001 deploy@<IP_VPS>   # luego http://localhost:3001
# usuario: admin · contraseña: $GRAFANA_ADMIN_PASSWORD

# O consulta directa a Prometheus (p. ej. p95 del API):
docker compose -f compose.prod.yaml -f compose.monitoring.yaml exec prometheus \
  wget -qO- 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket[5m]))by(le))'
```

Métricas clave (ISO/IEC 25023): latencia p50/p95 y RPS del API, CPU/RAM por contenedor
(cAdvisor), recibos anclados por minuto y pendientes de anclaje, y la latencia de anclaje
(`recibo_anclaje_latencia_segundos`, derivada de `creadoEn`/`ancladoEn`).

Las de anclaje las emite el **worker**, que se expone en `worker:9101/metrics`
dentro de la red interna. Prometheus las scrapea con la etiqueta `app="oasis-worker"`.

### 7.4 Cerrar

```bash
# Restaurar los límites de seguridad y reiniciar.
sed -i '/^THROTTLE_/d' .env
docker compose -f compose.prod.yaml up -d api

docker compose -f compose.prod.yaml -f compose.monitoring.yaml down
```

## 8. Operación

- Logs: `docker compose -f compose.prod.yaml logs -f api worker`.
- Cola de anclaje: `docker compose ... exec redis redis-cli keys 'bull:anclaje-recibos:*'`.
- Recibos fallidos: `POST /api/v1/recibos/:id/reintentar` (ADMIN) y, si es definitivo,
  `POST /api/v1/recibos/:id/anular` (ADMIN) que además anula on-chain cuando corresponde.
- Rotación de la cuenta operadora: genere una cuenta nueva, otorgue `REGISTRADOR_ROLE`
  (`grant-registrador.ts`), revoque el rol anterior con `revokeRole` (cuenta admin) y
  actualice `OPERATOR_PRIVATE_KEY` en `/opt/oasis/.env.worker` y reinicie el worker.
