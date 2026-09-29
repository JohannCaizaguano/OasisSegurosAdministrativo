# ADR-005 · Transactional Outbox con BullMQ

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

Validar un pago y emitir su recibo debe ser atómico en la base de datos. Enviar una
transacción a Polygon dentro de esa transacción SQL es inviable: la red puede tardar,
fallar o el proceso morir. Se necesita garantizar que **todo recibo emitido termine
anclado o marcado como FALLIDO**, aun con caídas.

## Decisión

Aplicar el patrón **Transactional Outbox** sobre la propia tabla `Recibo` y una cola
BullMQ (`anclaje-recibos`):

1. En una única transacción SQL: `pago = VALIDADO` + `Recibo = PENDIENTE_ANCLAJE`.
2. Después del commit, el API encola el job con `jobId = reciboId` (deduplicación).
3. El worker procesa la cola con concurrencia 1, 5 intentos y backoff exponencial.
4. Un barrido (`@nestjs/schedule`, cada 30 s) reencola los recibos que sigan en
   `PENDIENTE_ANCLAJE` con más de 60 s: cubre la caída del API entre commit y encolado,
   o la pérdida de Redis.
5. El procesador es idempotente (ver `docs/arquitectura/secuencia-anclaje.md`).

## Alternativas descartadas

- **Enviar la transacción dentro del request HTTP**: acopla la disponibilidad de Polygon
  a la UX del operador; un timeout deja el estado ambiguo.
- **Event emitter en memoria**: se pierde ante reinicios; no hay garantía de entrega.
- **Tabla outbox separada**: el propio `Recibo` ya es el registro del outbox; una tabla
  extra añade join y riesgo de desincronización.
- **Redis Streams/Kafka sin outbox**: resuelve la cola, no la atomicidad con la BD.

## Consecuencias

- Positivas: consistencia eventual garantizada; recuperación automática ante caídas;
  deduplicación por `jobId`; métricas del backlog (`recibos_pendientes_anclaje`).
- Negativas: el anclaje no es instantáneo (segundos a minutos); requiere Redis
  persistente (`appendonly yes`) y monitoreo de jobs fallidos.
