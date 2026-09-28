# C4 · Nivel 2: Contenedores

```mermaid
flowchart TB
  subgraph usuario["Navegador"]
    spa["web<br/>[Caddy 2]<br/>SPA estática + reverse proxy + TLS"]
  end

  subgraph vps["VPS (Ubuntu 24.04)"]
    subgraph edge["red edge"]
      proxy(("Caddy"))
    end
    subgraph interna["red internal (internal: true)"]
      api["api<br/>[NestJS HTTP]<br/>/api/v1, /metrics"]
      worker["worker<br/>[NestJS sin HTTP]<br/>anclaje + barrido 30 s"]
      migrate["migrate<br/>[tarea única]<br/>prisma migrate deploy"]
      pg[("postgres:17<br/>[PostgreSQL]")]
      redis[("redis:7<br/>[Redis]")]
    end
    chain["Polygon Amoy<br/>RegistroRecibos"]
  end

  spa -- "HTTPS /api/*" --> api
  spa -- "/ (SPA)" --> spa
  api -- "SQL (Prisma + adapter-pg)" --> pg
  api -- "BullMQ / refresh tokens" --> redis
  api -- "encola jobId=reciboId" --> redis
  worker -- "consume cola anclaje-recibos" --> redis
  worker -- "SQL" --> pg
  worker -- "viem: registra/anula (firma custodial)" --> chain
  api -- "eth_call de solo lectura" --> chain
  migrate -- "migraciones" --> pg
```

## Responsabilidades

| Contenedor | Responsabilidad                                                                                 | Escala | Clave                                             |
| ---------- | ----------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------- |
| `web`      | Sirve la SPA y redirige `/api/*` al API (mismo origen, sin CORS).                               | 1      | Caddy obtiene el certificado TLS automáticamente. |
| `api`      | API HTTP `/api/v1`, auth JWT, CRUD, `/health`, `/metrics` (solo red interna).                   | 1      | **Nunca** tiene la clave privada.                 |
| `worker`   | Procesa la cola `anclaje-recibos` (concurrencia 1, 5 intentos, backoff) y el barrido cada 30 s. | 1      | Único contenedor con `OPERATOR_PRIVATE_KEY`.      |
| `migrate`  | Aplica migraciones y termina (`service_completed_successfully`).                                | —      | Arranca antes que api/worker.                     |
| `postgres` | Datos de negocio (Decimal(12,2), UUID, índices).                                                | 1      | Sin puertos publicados.                           |
| `redis`    | BullMQ (Transactional Outbox) + refresh tokens (rotación).                                      | 1      | `appendonly yes`.                                 |

## Comunicación

- **Frontend → API**: mismo origen (`https://dominio/api/v1`). El refresh token viaja en
  cookie `httpOnly`, `Secure`, `SameSite=Strict` con rotación.
- **API → worker**: nunca se llaman entre sí; el contrato es la base de datos (outbox) y
  la cola BullMQ (`jobId = reciboId`).
- **worker → cadena**: `simulateContract` + `writeContract` con `maxFeePerGas` acotado;
  `nonceManager` y concurrencia 1 evitan colisiones de nonce.
- **api → cadena**: solo `eth_call` (lectura) para la verificación pública.
