# Despliegue en producción (OVHcloud VPS-1 · Ubuntu 24.04)

Guía para poner el sistema en línea con TLS, backups y anclaje real en Amoy.

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
`/opt/oasis`. Antes de cerrar la sesión root, verifique el acceso por clave con `deploy`.

## 2. DNS y certificado

1. Cree el registro **A** `oasis.example.com → IP del VPS`.
2. No hay que configurar TLS: Caddy solicita el certificado automáticamente en el primer
   arranque (puertos 80/443 abiertos).

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

`.env.worker` (archivo separado, `chmod 600`):

```ini
# Clave de la cuenta operadora (REGISTRADOR_ROLE). Solo la inyecta el worker.
OPERATOR_PRIVATE_KEY=<clave de la cuenta operadora>
```

```bash
install -m 600 /dev/null /opt/oasis/.env.worker   # y editar
echo <PAT> | docker login ghcr.io -u <usuario> --password-stdin
cd /opt/oasis && docker compose -f compose.prod.yaml up -d
```

`compose.prod.yaml` carga `.env.worker` solo en el servicio `worker` (ADR-006);
verifíquelo con `docker inspect` sobre `api` (0 apariciones de `OPERATOR_PRIVATE_KEY`) y
`worker` (1). El contenedor `migrate` aplica las migraciones y termina; `api` y `worker`
esperan a que complete. Compruebe el health y siembre los datos iniciales (una vez):

```bash
curl -fsS "https://$(grep '^DOMAIN=' /opt/oasis/.env | cut -d= -f2)/api/v1/health"
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

Anote en esta tabla:

| Elemento                            | Valor                                              |
| ----------------------------------- | -------------------------------------------------- |
| Dirección del contrato              | _(completar)_                                      |
| Bloque de despliegue                | _(completar)_                                      |
| Cuenta admin (DEFAULT_ADMIN_ROLE)   | _(completar)_                                      |
| Cuenta operadora (REGISTRADOR_ROLE) | _(completar)_                                      |
| Enlace al explorador                | https://amoy.polygonscan.com/address/_(completar)_ |

Copie `CONTRACT_ADDRESS` al `.env` del VPS y `OPERATOR_PRIVATE_KEY` a `.env.worker`
(ambos `chmod 600`) y ejecute `docker compose -f compose.prod.yaml up -d`.

## 5. Backups

```bash
/opt/oasis/infra/scripts/backup-db.sh                                    # prueba manual
/opt/oasis/infra/scripts/restore-db.sh /opt/oasis/backups/oasis-<fecha>.sql.gz
```

Cron diario sugerido (usuario `deploy`), con rotación de 7 días:

```cron
15 3 * * * /opt/oasis/infra/scripts/backup-db.sh >> /var/log/oasis-backup.log 2>&1
```

Configure además una copia fuera del servidor (descomente la línea de `rclone` en el
script). Restaure al menos una vez antes de la evaluación.

## 6. Actualizaciones

Automático (recomendado): cree el tag `vX.Y.Z`; GitHub Actions publica las imágenes,
despliega por SSH y ejecuta el smoke test. Manual: `infra/scripts/deploy.sh <tag>`.

## 7. Día de la evaluación

### 7.1 Preparación

```bash
# 1. Stack de monitoreo (se combina con producción).
#    NO cree la red a mano: compose.prod.yaml ya declara `oasis_internal`.
docker compose -f compose.prod.yaml -f compose.monitoring.yaml up -d

# 2. Subir el rate limiter para la medición: los valores por defecto son de
#    seguridad y harían que los escenarios midieran el limitador. Anote el
#    valor usado en el informe y restáurelos al terminar (7.4).
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

Cada escenario calcula su cadencia a partir de los límites vigentes (o de los valores por
defecto si no se subieron). `validar-pago.js` emite recibos reales: deja la base con
varios pagos `VALIDADO` y sus recibos `ANCLADO`, lo esperado tras la evaluación.

### 7.3 Exportar métricas

```bash
# Grafana está enlazado solo a loopback del host: el túnel apunta al 3001.
ssh -L 3001:localhost:3001 deploy@<IP_VPS>   # luego http://localhost:3001
# usuario: admin · contraseña: $GRAFANA_ADMIN_PASSWORD

# O consulta directa a Prometheus (p. ej. p95 del API):
docker compose -f compose.prod.yaml -f compose.monitoring.yaml exec prometheus \
  wget -qO- 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket[5m]))by(le))'
```

Métricas clave (ISO/IEC 25023): latencia p50/p95 y RPS del API, CPU/RAM por contenedor
(cAdvisor), recibos anclados y pendientes, y latencia de anclaje
(`recibo_anclaje_latencia_segundos`). Las de anclaje las emite el **worker**
(`worker:9101/metrics`, red interna; Prometheus las etiqueta `app="oasis-worker"`).

### 7.4 Cerrar

```bash
sed -i '/^THROTTLE_/d' .env                    # restaurar límites de seguridad
docker compose -f compose.prod.yaml up -d api
docker compose -f compose.prod.yaml -f compose.monitoring.yaml down
```

## 8. Operación

- Logs: `docker compose -f compose.prod.yaml logs -f api worker`.
- Cola de anclaje: `docker compose ... exec redis redis-cli keys 'bull:anclaje-recibos:*'`.
- Recibos fallidos: `POST /api/v1/recibos/:id/reintentar` (ADMIN) y, si es definitivo,
  `POST /api/v1/recibos/:id/anular` (ADMIN), que además anula on-chain cuando corresponde.
- Rotación de la cuenta operadora: genere una cuenta nueva, otorgue `REGISTRADOR_ROLE`
  (`grant-registrador.ts`), revoque el rol anterior con `revokeRole` (cuenta admin) y
  actualice `OPERATOR_PRIVATE_KEY` en `.env.worker` y reinicie el worker.
