# ADR-020 · Plan de cuotas y saldo de la póliza

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S4 (se completa en S5 y S6)

## Contexto

HU-35 pide definir el plan de cuotas, HU-36 aplicar los pagos a las cuotas, HU-37 marcar las
vencidas, HU-15 mostrar el saldo y HU-16 impedir que un pago supere el saldo (RN-02). Las pólizas
registradas en S3 no tienen cuotas, y la mora, el saldo y la cartera necesitan cuotas sobre las
que operar.

## Decisión

- **Cuota única por defecto.** Toda póliza nace con una cuota por la prima total, con vencimiento
  en `fechaInicio`, en la misma transacción que la crea; la migración de S4 crea esa cuota para las
  pólizas existentes.
- **Redefinir el plan.** `PUT /polizas/:id/cuotas` reemplaza el plan completo (1 a 24 cuotas,
  números consecutivos, fechas crecientes dentro de la vigencia) solo si la póliza está VIGENTE y
  no tiene pagos VALIDADOS. La suma debe ser igual a la prima (RN-15). La propuesta mensual
  (`proponerPlanCuotas`) trabaja en centavos enteros: la última cuota absorbe el residuo y las
  fechas se recortan al último día del mes. Reemplazar cuotas sin aplicaciones es el único borrado
  permitido del sistema.
- **Cambio de prima.** Con una cuota, la cuota toma la prima nueva; con N cuotas, se recalculan los
  valores y se conservan las fechas. Cambiar la vigencia de modo que alguna cuota quede fuera de
  ella se rechaza (`PLAN_FUERA_DE_VIGENCIA`).
- **Saldo.** `saldo = primaTotal − Σ pagos VALIDADOS`. RN-02 se exige al registrar y otra vez al
  validar; desde S5 la comprobación definitiva ocurre dentro de la transacción de validación, con
  las cuotas bloqueadas (`FOR UPDATE`).
- **Aplicación (S5).** Cada pago validado se aplica a las cuotas no pagadas por orden de
  vencimiento (RN-13): cubierta → PAGADA, parcial → PARCIAL; una cuota VENCIDA sigue VENCIDA hasta
  cubrirse. Invariante: por póliza, `Σ Cuota.valorPagado = Σ pagos VALIDADOS`.
- **Vencimiento y mora.** Una tarea del worker a las 00:05 de Guayaquil marca VENCIDA toda cuota no
  pagada con vencimiento anterior a hoy (RN-14); una póliza con alguna cuota VENCIDA está en mora
  (RN-16).
- **Anulación (S6).** Anular un recibo anula su pago y revierte sus aplicaciones (`revertidaEn`), así
  que el saldo y las cuotas recuperan el valor sin borrar evidencia.

## Alternativas descartadas

- **Pólizas sin cuotas hasta definir un plan:** obliga a tratar dos casos en el saldo, la mora y la
  cartera.
- **Saldo solo desde las cuotas:** antes de HU-36 las cuotas no reflejan los pagos; con el
  invariante, ambas cifras coinciden.
- **Versionar los planes:** nadie lo pidió; el reemplazo completo basta mientras no haya pagos
  validados.

## Consecuencias

- Positivas: saldo, mora, cartera y recordatorios operan siempre sobre cuotas; ningún pago puede
  dejar la póliza con saldo negativo. En S4, dos validaciones simultáneas sobre la misma póliza
  aún pueden pasar las dos; el bloqueo de S5 cierra ese caso.
- Negativas: un plan no se puede cambiar después del primer pago validado; corregirlo exige anular
  los recibos de esos pagos.
