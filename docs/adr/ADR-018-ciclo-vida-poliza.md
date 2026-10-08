# ADR-018 · Ciclo de vida de la póliza

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: 5

## Contexto

HU-12 a HU-14 cambian el ciclo de vida de la póliza: el registro deja de aceptar un `estado`
entrante y un ramo por texto libre, la renovación no estaba definida y `DELETE /polizas/:id` deja
de tener sentido con RN-09. S6–S8 (cuotas, pagos y saldo) heredan estas reglas, así que deben
quedar escritas antes de tocar el API.

## Decisión

- **Registro (HU-12).** `POST /polizas` no acepta `estado`: toda póliza nace **VIGENTE**. El ramo
  llega como `ramoId` del catálogo (`GET /ramos`), no como texto libre. `fechaFin` debe ser
  estrictamente posterior a `fechaInicio` y `primaTotal` mayor que cero con hasta dos decimales
  (RN-10). Número repetido → 409 `NUMERO_DUPLICADO`; cliente inactivo → 422 `CLIENTE_INACTIVO`;
  ramo inexistente o inactivo → 422 `RAMO_INVALIDO` (errores con `details: { campo, motivo }`).
- **Edición (HU-13).** `PATCH /polizas/:id` solo sobre una póliza VIGENTE (si no → 422
  `POLIZA_NO_VIGENTE`), y solo de `numero`, `aseguradoraId`, `ramoId`, `primaTotal`, `fechaInicio`
  y `fechaFin`. El esquema rechaza `clienteId` y `estado`: mover una póliza con pagos o recibos a
  otro cliente rompe la trazabilidad. La prima no cambia si hay pagos VALIDADOS → 422
  `PRIMA_CON_PAGOS_VALIDADOS`; si llega una sola fecha, se compara con la guardada.
- **Estados (HU-13).** `POST /polizas/:id/estado` con `{ estado: 'VENCIDA' | 'CANCELADA' }`: solo
  desde VIGENTE y ambos destinos son **terminales**, sin vuelta atrás. Se audita como
  `CAMBIAR_ESTADO`, con el estado nuevo en el detalle.
- **Sin borrado.** Se retira `DELETE /polizas/:id` (caso de uso y método del repositorio): una
  póliza no se elimina, se CANCELA (RN-09).
- **RN-01.** Una póliza que no está VIGENTE no admite pagos: `CrearPagoUseCase` responde 422
  `POLIZA_NO_VIGENTE` (404 si no existe) antes de resolver el método de pago.
- **Renovación.** Renovar es registrar una póliza nueva con otro número; la vencida no se reactiva.

## Alternativas descartadas

- **VENCIDA → VIGENTE para renovar:** reescribiría el historial de una póliza cuyos pagos y
  recibos ya están anclados; una póliza nueva deja la trazabilidad intacta.
- **Borrar pólizas sin pagos:** RN-09 prohíbe el borrado; CANCELADA cubre el error de registro y
  conserva el número consumido.
- **Un cliente editable:** permitir `clienteId` en el `PATCH` reasignaría pagos y recibos a otro
  cliente, contra la trazabilidad del recibo.

## Consecuencias

- Positivas: el estado y la vigencia tienen una única vía de cambio, auditada; el esquema estricto
  evita que la SPA ofrezca acciones que el API rechaza; S6–S8 pueden asumir estados terminales.
- Negativas: corregir un cliente mal elegido exige cancelar la póliza y crear otra; una póliza
  vencida por error no se reabre.
