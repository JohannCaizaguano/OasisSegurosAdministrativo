# Secuencia: validación del pago y anclaje del recibo

Patrón **oráculo de salida push-based** + **Transactional Outbox**.

```mermaid
sequenceDiagram
  autonumber
  actor OP as OPERADOR
  participant SPA as web (SPA)
  participant API as api (NestJS)
  participant DB as postgres
  participant Q as redis (BullMQ)
  participant W as worker
  participant CH as Polygon Amoy

  OP->>SPA: Valida un pago (REGISTRADO)
  SPA->>API: PATCH /api/v1/pagos/:id/validar
  API->>API: EmitirRecibo (payload canónico, sal, hash, idOnchain, codigo)
  API->>DB: TRANSACCIÓN ÚNICA: pago=VALIDADO + Recibo(PENDIENTE_ANCLAJE)
  Note over API,DB: commit
  API->>Q: encolar job (jobId = reciboId, sin duplicados)
  API-->>SPA: 200 { pago VALIDADO, recibo PENDIENTE_ANCLAJE }

  Q-->>W: job anclaje-recibos
  W->>DB: buscar recibo
  alt recibo ya ANCLADO/ANULADO
    W-->>Q: fin (idempotente)
  else contrato ya tiene idOnchain (recuperación tras caída)
    W->>CH: verificar(idOnchain)
    W->>DB: marcar ANCLADO
  else envío normal
    W->>CH: simular registrar(idOnchain, hashRecibo)
    W->>CH: registrar(...) con maxFeePerGas acotado
    W->>DB: txHash + ENVIADO + enviadoEn
    CH-->>W: receipt (confirmado)
    W->>DB: ANCLADO + blockNumber + gasUsed + effectiveGasPrice + ancladoEn
  end

  Note over W: Si se agotan los 5 intentos: FALLIDO + ultimoError

  par Barrido del outbox
    loop cada 30 s
      W->>DB: recibos PENDIENTE_ANCLAJE con >60 s
      W->>Q: reencolar (mismo jobId)
    end
  end

  actor PUB as Público
  PUB->>SPA: /verificar/:codigo (sin login)
  SPA->>API: GET /api/v1/public/recibos/:codigo/verificacion
  API->>DB: leer recibo (payloadCanonico + sal)
  API->>API: recalcular hashRecibo
  API->>CH: verificar(idOnchain)
  API-->>SPA: estado + txHash + enlace al explorador (sin datos personales)
```

## Idempotencia ante caídas

| Punto de falla                                          | Recuperación                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| API cae tras el commit y antes de encolar               | El barrido de 30 s reencola el recibo que sigue en `PENDIENTE_ANCLAJE` (>60 s).                    |
| Worker cae tras `registrar` y antes de guardar `txHash` | Al reintentar, `verificar(idOnchain)` detecta el registro on-chain y marca `ANCLADO` sin reenviar. |
| Worker cae tras guardar `txHash` y antes del receipt    | Al reintentar, `consultarTransaccion(txHash)` confirma y sincroniza `blockNumber`/`gasUsed`.       |
| Reintento manual (ADMIN) sobre `FALLIDO`                | `POST /api/v1/recibos/:id/reintentar` reencola con el mismo `jobId`.                               |

Evidencia automatizada: `apps/api/test/idempotencia-anclaje.e2e-spec.ts` simula ambos
puntos de falla y verifica que en la cadena exista **un único** evento `ReciboRegistrado`.
