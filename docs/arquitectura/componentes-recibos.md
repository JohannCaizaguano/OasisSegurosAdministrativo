# Componentes del módulo Recibos ("Módulo Blockchain")

El módulo `apps/api/src/modules/recibos` es hexagonal: el dominio es TypeScript puro y
las dependencias externas entran por puertos implementados con adaptadores.

```mermaid
flowchart TB
  subgraph presentation["presentation (HTTP)"]
    ctrl["RecibosController<br/>(JWT + roles)"]
    pub["VerificacionPublicaController<br/>(público, throttling estricto)"]
  end

  subgraph application["application (casos de uso + puertos)"]
    emitir["EmitirRecibo"]
    anclar["AnclarRecibo<br/>(idempotente)"]
    verificar["VerificarRecibo"]
    reencolar["ReencolarPendientes"]
    anular["AnularRecibo /<br/>AnularReciboEnCadena"]
    puertos["Puertos:<br/>RecibosRepositoryPort<br/>RegistroRecibosPort<br/>ColaAnclajePort<br/>ConfiguracionCadenaPort<br/>HasherRecibosPort<br/>CriptoPort"]
  end

  subgraph domain["domain (puro)"]
    recibo["Recibo (entidad + estados)<br/>PENDIENTE_ANCLAJE → ENVIADO → ANCLADO<br/>FALLIDO / ANULADO"]
    hash["HashRecibo (VO)<br/>payload canónico RFC 8785"]
  end

  subgraph infrastructure["infrastructure (adaptadores)"]
    prisma["PrismaRecibosRepository"]
    viem["ViemRegistroRecibosAdapter<br/>(read + write opcional)"]
    viemHash["ViemHasherRecibosAdapter<br/>(keccak256)"]
    bull["BullMqColaAnclajeAdapter"]
    proc["AnclajeProcessor<br/>(concurrency 1, 5 intentos)"]
    barrido["BarridoPendientesTask<br/>(@Interval 30 s)"]
    guard["RecibosModule / WorkerModule"]
  end

  ctrl --> application
  pub --> verificar
  puertos -. implementados por .-> infrastructure
  application --> domain
  proc --> anclar
  barrido --> reencolar
  guard -. inyecta con tokens Symbol .-> puertos
```

## Puertos e implementaciones

| Puerto (token Symbol) | Adaptador                                                | Entorno      |
| --------------------- | -------------------------------------------------------- | ------------ |
| `RECIBOS_REPOSITORY`  | `PrismaRecibosRepository`                                | api + worker |
| `REGISTRO_RECIBOS`    | `ViemRegistroRecibosAdapter` (sin wallet = solo lectura) | api          |
| `REGISTRO_RECIBOS`    | mismo adaptador + `WALLET_CLIENT` global                 | worker       |
| `COLA_ANCLAJE`        | `BullMqColaAnclajeAdapter`                               | api          |
| `CONFIG_CADENA`       | `ConfiguracionCadenaAdapter`                             | api + worker |
| `HASHER_RECIBOS`      | `ViemHasherRecibosAdapter`                               | api + worker |
| `CRIPTO`              | `NodeCriptoAdapter` (uuid, código público, sal 32 B)     | api + worker |

## Regla de dependencias (verificada con dependency-cruiser)

```
domain         → TypeScript puro (sin Nest, Prisma, viem, BullMQ)
application    → domain + sus puertos
infrastructure → implementa puertos (Nest, Prisma, viem, BullMQ)
presentation   → casos de uso (nunca adaptadores)
```

`pnpm depcruise` falla si se viola esta regla; se probó introduciendo una importación de
`viem` en `domain/` y la regla la detecta.

## Hash del recibo

1. `payload = { codigo, pagoId, numeroPoliza, monto, moneda:"USD", fechaPago, emitidoEn }`
2. `payloadCanonico = canonicalize(payload)` (RFC 8785).
3. `hashRecibo = keccak256(sal ‖ payloadCanonico)`; la sal (32 bytes) **solo** se guarda
   en PostgreSQL.
4. `idOnchain = keccak256(uuid del recibo)`.
