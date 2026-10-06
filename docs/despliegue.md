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
RPC_URL=https://polygon-amoy-bor-rpc.publicnode.com
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

En la laptop del responsable (nunca en el VPS). Todos los comandos se ejecutan desde la raíz
del repositorio:

```bash
# 1. Guardar las claves cifradas con hardhat-keystore (nada en texto plano).
#    La API key V2 de etherscan.io es gratuita y sirve para todas las chains soportadas.
pnpm --filter @oasis/contracts exec hardhat keystore set DEPLOYER_PRIVATE_KEY
pnpm --filter @oasis/contracts exec hardhat keystore set OPERATOR_PRIVATE_KEY
pnpm --filter @oasis/contracts exec hardhat keystore set AMOY_RPC_URL
pnpm --filter @oasis/contracts exec hardhat keystore set ETHERSCAN_API_KEY

# 2. Comprobar a qué cuenta corresponde cada clave y su saldo (no revela las claves):
pnpm --filter @oasis/contracts exec hardhat run scripts/cuentas.ts --network amoy
pnpm --filter @oasis/contracts exec hardhat run scripts/cuentas.ts --network amoyOperador

# 3. Fondear las cuentas desde el faucet de Amoy: ≈ 0,06 POL en la admin (despliegue) y
#    0,01 POL en la operadora. El faucet de Alchemy exige saldo en mainnet; QuickNode y
#    ETHGlobal no lo exigen.

# 4. Desplegar con Ignition
pnpm --filter @oasis/contracts deploy:amoy

# 5. Verificar el contrato en PolygonScan. `--network amoy` es obligatorio: sin él, Hardhat
#    intenta verificar contra la red local 31337. El error HHE80027 de Blockscout es
#    esperado: Amoy no tiene Blockscout configurado; PolygonScan y Sourcify sí verifican.
pnpm --filter @oasis/contracts exec hardhat ignition verify chain-80002 --network amoy

# 6. Otorgar REGISTRADOR_ROLE a la cuenta operadora
CONTRACT_ADDRESS=<direccion> OPERATOR_ADDRESS=<cuenta_operadora> \
  pnpm --filter @oasis/contracts exec hardhat run scripts/grant-registrador.ts --network amoy

# 7. Registrar el hash de prueba (firma como la cuenta operadora, ADR-006)
CONTRACT_ADDRESS=<direccion> \
  pnpm --filter @oasis/contracts exec hardhat run scripts/registrar-prueba.ts --network amoyOperador
```

> **WSL:** si `pnpm` es el binario de Windows, las variables exportadas en la shell de WSL no
> llegan al proceso. Antes de los pasos 6 y 7 ejecute
> `export WSLENV="$WSLENV:CONTRACT_ADDRESS:OPERATOR_ADDRESS"`; las variables en línea se
> propagan igual. Los demás pasos no lo necesitan: leen las claves del keystore.

Tabla del despliegue (Amoy, 05/10/2026):

| Elemento                                             | Valor                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dirección del contrato                               | `0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b`                                                                                                                                                                                                                                              |
| Transacción y bloque del despliegue                  | `0x9d8f6508df047d6f357d79a7684032f43c04ff7dad7075e94190b368d990d7c6` · bloque 49 418 753                                                                                                                                                                                                  |
| Gas del despliegue                                   | 566 793 (≈ 0,01814 POL)                                                                                                                                                                                                                                                                   |
| Cuenta admin (`DEFAULT_ADMIN_ROLE`)                  | `0xf0992d47ac1fe44067b5ccf367024d8f6957e897`                                                                                                                                                                                                                                              |
| Cuenta operadora (`REGISTRADOR_ROLE`)                | `0x07132217d5c7b412673bc997ba11bf0adf1044ac`                                                                                                                                                                                                                                              |
| Transacción de `grantRole`                           | `0xa24269adef57eedcc2b2c0304536daae7afb605a48b7481a5256dfcd60edeb0b` · bloque 49 419 132 · gas 61 557                                                                                                                                                                                     |
| Hash de prueba (id, hash, transacción, bloque y gas) | id `0x5d9af3a7c29ff8fe131f8b148d3dbbc9ba4622b8d645b4baf1768b9dd25dc713` · hash `0xb7edceb7d880d50fec76179abb819eb6ab73ddbf1dd3b305b3d6d0a2204c6553` · tx `0xeec28204772749f55fedcea46ae7e41851192a0ccf964cc713e3dc6dd800e0fb` · bloque 49 419 171 · gas 84 242 (0,002688372831655118 POL) |
| Código verificado                                    | `https://amoy.polygonscan.com/address/0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b#code` · también en [Sourcify](https://sourcify.dev/server/repo-ui/80002/0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b)                                                                                      |

El gas real de `registrar` en Amoy (84 242) queda por debajo del límite de RNF-07
(100 000), igual que la media local del reporte (78 417). El despliegue costó ≈ 0,0181 POL,
`grantRole` ≈ 0,0025 POL y el registro de prueba 0,002688372831655118 POL (≈ 0,003), como
presupuestó el sprint.

`CONTRACT_ADDRESS` de Amoy y `OPERATOR_PRIVATE_KEY` pasan al VPS en HT-06 (S13): el primero
al `.env` y la segunda a `.env.worker` (ambos `chmod 600`), y luego
`docker compose -f compose.prod.yaml up -d`.

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
k6 run -e BASE_URL -e EMAIL -e PASSWORD infra/k6/verificacion-recibo.js
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
