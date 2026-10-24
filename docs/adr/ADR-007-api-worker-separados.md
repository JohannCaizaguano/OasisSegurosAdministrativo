# ADR-007 · API y worker como procesos y contenedores separados

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S4

## Contexto

El anclaje de recibos (ADR-005) firma transacciones con la cuenta operadora del bróker (ADR-006).
Si la clave vive en el proceso que atiende HTTP, cualquier fallo del API expuesto la pone en riesgo.
Además, el anclaje no debe competir con las peticiones del personal ni detenerse cuando el API se
reinicia por un despliegue.

## Decisión

- **Un código, dos procesos.** `apps/api` compila un solo paquete con dos entradas: `src/main.ts`
  levanta el HTTP (`AppModule`) y `src/worker.ts` el worker (`WorkerModule`), sin HTTP salvo el
  exportador de `/metrics` en `WORKER_METRICS_PORT`.
- **La clave solo en el worker.** Solo `WorkerModule` importa `CuentaOperadoraModule` y valida
  `OPERATOR_PRIVATE_KEY` con `validateWorkerEnv`; el esquema de entorno del API no la conoce y el
  API solo lee el contrato.
- **Comunicación por la cola.** El API escribe en PostgreSQL y encola en Redis (BullMQ); el worker
  consume las colas `anclaje-recibos` y `notificaciones` y ejecuta las tareas programadas
  (barrido de pendientes, vencimiento de cuotas, saldo de la operadora, recordatorios).
- **Despliegue.** En producción son dos servicios de `compose.prod.yaml` con la misma imagen y
  distinto comando; solo el worker monta `.env.worker`.

## Alternativas descartadas

- **Un solo proceso con la cola dentro:** más simple, pero la clave quedaría en el proceso expuesto
  a Internet y un reinicio del API cortaría los anclajes en curso.
- **Función serverless para firmar:** agrega un proveedor y otra superficie de secretos para un
  volumen de pocas transacciones al día.

## Consecuencias

- Positivas: la clave de firma no está en el contenedor que atiende peticiones; el API responde la
  validación sin esperar la cadena (HU-23); el worker se escala o reinicia por separado.
- Negativas: dos procesos que levantar en desarrollo (`pnpm dev` los arranca con `concurrently`) y
  dos conjuntos de métricas; las e2e con anclaje deben levantar `WorkerModule` en el mismo proceso.
