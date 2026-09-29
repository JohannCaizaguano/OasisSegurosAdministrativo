# ADR-010 · Modelo de datos completo en la migración inicial

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

La arquitectura cierra el modelo de datos (sección 9 y transcripción textual 9.0):
**12 entidades** (`Usuario`, `TokenRecuperacion`, `BitacoraAuditoria`, `Cliente`,
`Aseguradora`, `Ramo`, `Poliza`, `Cuota`, `MetodoPago`, `Pago`, `AplicacionPago` y
`Recibo`), todas con `id` UUID y montos `Decimal(12,2)`.

El backlog reparte su uso entre varios sprints (auditoría en S2, cuotas en S6,
recuperación de contraseña en S12), pero el diseño ya está cerrado y no tiene sentido
migrar por partes: cada sprint posterior agregaría tablas y columnas correctivas,
generando ruido de migraciones y riesgo de deriva entre el diagrama y la base de datos
que la tesis cita.

El despliegue en el VPS recién ocurre en S13: hasta ese momento **no existe una base
de datos productiva** ni datos reales que preservar.

## Decisión

- La migración inicial define **todo** el modelo de la sección 9.0: tablas, enums con
  los valores exactos, restricciones únicas (`Usuario.email`, `Usuario.clienteId`,
  `Cliente.identificacion`, `Aseguradora.ruc`, `Poliza.numero`, `Recibo.codigo`,
  `Recibo.pagoId`) e índices sobre claves foráneas y consultas previsibles
  (`Pago.estado`, `Cuota(estado, fechaVencimiento)`, `Recibo(estado, creadoEn)`).
- Sin borrado en cascada: los registros con historial se desactivan o cambian de
  estado (RN-09); las relaciones se declaran sin `onDelete`.
- El _squash_ de migraciones se permite **solo antes del primer despliegue**; a partir
  del despliegue en el VPS, cada cambio de esquema exige una migración incremental.
- Las entidades que aún no tienen lógica (cuotas, aplicaciones de pago, tokens de
  recuperación, bitácora) existen como tablas; su código llega en su sprint
  correspondiente. El seed de S1 siembra los catálogos `Ramo` y `MetodoPago`.

## Alternativas descartadas

- **Migrar entidad por entidad en cada sprint**: multiplica las migraciones, obliga a
  reescribir pruebas y hace que el diagrama del capítulo de diseño quede desincronizado
  de la base real.
- **Esperar a cada historia para definir su tabla**: el modelo ya está cerrado en la
  arquitectura; volver a decidirlo por sprint duplicaría el trabajo de diseño.

## Consecuencias

- Positivas: una única migración reproducible (`prisma migrate deploy` en un clon
  limpio y en CI); el esquema del repositorio coincide exactamente con la ilustración
  9.1 de la arquitectura.
- Negativas: una base de desarrollo creada con la versión anterior requiere
  `prisma migrate reset` (solo desarrollo; no hay despliegue previo); hay tablas sin
  uso hasta su sprint, visible en el esquema pero sin código muerto asociado.
