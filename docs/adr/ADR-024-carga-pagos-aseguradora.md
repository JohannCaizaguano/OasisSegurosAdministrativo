# ADR-024 · Carga de pagos notificados por la aseguradora

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S7

## Contexto

Las aseguradoras cobran las primas, principalmente por débito bancario, y notifican al bróker qué
clientes pagaron (reunión del 07/10/2026). HU-50 pide cargar ese archivo por aseguradora, validar
cada fila con RN-01, RN-02, RN-22 y RN-23, revisar una vista previa y validar los pagos de uno en
uno o todos con una confirmación.

## Decisión

- **Reutilizar la importación (ADR-022)** con el tipo `PAGOS_ASEGURADORA` y la aseguradora en el
  registro `Importacion`. Columnas: número de póliza, fecha de cobro, monto y referencia.
- **Reglas por fila:** la póliza existe, es de la aseguradora elegida (RN-23) y está VIGENTE
  (RN-01); el monto **acumulado por póliza dentro del archivo** no supera el saldo (RN-02); la
  referencia no está registrada para esa póliza ni se repite en el archivo (RN-22, respaldada por
  `@@unique([polizaId, referencia])` desde S4).
- **Resultado:** pagos REGISTRADO con el método Débito bancario, con `importacionId` y el operador
  como autor.
- **Validar la carga:** valida en orden cada pago REGISTRADO de la carga con el caso de uso normal
  (cada uno en su transacción y con sus reglas de nuevo) y devuelve los validados y los fallidos con
  su motivo; la bitácora registra cada validación y la de la carga.
- **Mesa de validación:** la fila de la notificación se muestra como el documento del pago.

## Alternativas descartadas

- **Validar la carga en una sola transacción:** un pago que ya no cabe en el saldo revertiría todos.
- **Registrar los pagos ya validados:** el backlog pide que queden listos para validarse; la revisión
  humana se conserva.

## Consecuencias

- Positivas: una carga no puede saltarse RN-02 repartiendo montos; la trazabilidad por pago se
  mantiene aunque se validen en bloque.
- Negativas: validar una carga grande tarda lo que tardan N transacciones (pocos segundos para los
  volúmenes de Oasis).
