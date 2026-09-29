# ADR-010 · Modelo de datos completo en la migración inicial

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

La arquitectura cierra el modelo de datos (§9 y transcripción 9.0): **12 entidades**
(`Usuario`, `TokenRecuperacion`, `BitacoraAuditoria`, `Cliente`, `Aseguradora`, `Ramo`,
`Poliza`, `Cuota`, `MetodoPago`, `Pago`, `AplicacionPago` y `Recibo`), con `id` UUID y
montos `Decimal(12,2)`. El backlog reparte su uso entre varios sprints (auditoría en S2,
cuotas en S6, recuperación de contraseña en S12), pero el diseño ya está cerrado: migrar
por partes generaría migraciones correctivas y deriva entre el diagrama y la base. El
despliegue en el VPS recién ocurre en S13, así que hasta entonces **no existe una base
productiva** ni datos que preservar.

## Decisión

- La migración inicial define **todo** el modelo de §9.0: tablas, enums exactos, únicos
  (`Usuario.email`, `Usuario.clienteId`, `Cliente.identificacion`, `Aseguradora.ruc`,
  `Poliza.numero`, `Recibo.codigo`, `Recibo.pagoId`) e índices sobre claves foráneas y
  consultas previsibles (`Pago.estado`, `Cuota(estado, fechaVencimiento)`,
  `Recibo(estado, creadoEn)`).
- Sin borrado en cascada: los registros con historial se desactivan o cambian de estado
  (RN-09); las relaciones se declaran sin `onDelete`.
- El _squash_ de migraciones se permite **solo antes del primer despliegue**; a partir de
  él, cada cambio de esquema exige migración incremental.
- Las entidades sin lógica aún (cuotas, aplicaciones, tokens, bitácora) existen como
  tablas; su código llega en su sprint. El seed de S1 siembra `Ramo` y `MetodoPago`.

## Alternativas descartadas

- **Migrar entidad por entidad en cada sprint**: multiplica migraciones, obliga a
  reescribir pruebas y desincroniza el diagrama del capítulo de diseño.
- **Esperar a cada historia para definir su tabla**: el modelo ya está cerrado; volver a
  decidirlo por sprint duplicaría el trabajo de diseño.

## Consecuencias

- Positivas: una única migración reproducible (`migrate deploy` en clon limpio y CI); el
  esquema coincide exactamente con la ilustración 9.1 de la arquitectura.
- Negativas: una base de desarrollo creada con la versión anterior requiere
  `prisma migrate reset`; hay tablas sin uso hasta su sprint (visible en el esquema, sin
  código muerto asociado).
