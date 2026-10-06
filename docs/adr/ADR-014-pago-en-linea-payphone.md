# ADR-014 · Pago en línea con la Cajita de Pagos de PayPhone, confirmado desde el backend

- **Estado**: aceptado (pendiente de implementar)
- **Fecha**: 2026-10
- **Sprint**: 12

## Contexto

Oasis Seguros pidió que el cliente pague sus cuotas desde el portal, sin transferir y enviar el
comprobante (HU-48 y HU-49; RF-53 a RF-55, RN-19 a RN-21, RNF-30 y RNF-31). El sistema cobra en
USD en Ecuador, no debe tocar datos de tarjeta y el pago debe terminar en el mismo ciclo
pago → recibo → anclaje de ADR-005.

## Decisión

- La SPA embebe la **Cajita de Pagos de PayPhone** con el monto en centavos y un
  `clientTransactionId` único creado por el API en una `TransaccionPagoLinea` PENDIENTE.
- Al volver de la pasarela, el **API confirma la transacción** con el servicio de confirmación
  de PayPhone usando el token de la tienda. Si es aprobada, una sola `$transaction` registra el
  pago VALIDADO, lo aplica a las cuotas y crea el recibo PENDIENTE_ANCLAJE (outbox).
- Puerto `PasarelaPagosPort` con el adaptador `PayPhoneAdapter`; la confirmación es idempotente
  por `clientTransactionId` y una tarea del worker reconsulta las transacciones PENDIENTE con
  más de 10 minutos.
- Durante el proyecto se usa el entorno de pruebas de PayPhone; producción solo cambia
  credenciales.

## Alternativas descartadas

- **Kushki u otra pasarela**: viable, pero PayPhone ofrece un componente embebible y un
  entorno de pruebas sin costo con menos integración para un solo desarrollador.
- **Formulario de tarjeta propio**: obliga a cumplir PCI DSS y a custodiar datos sensibles.
- **Confirmar desde el navegador**: el resultado podría falsificarse; el token no debe salir
  del servidor.

## Consecuencias

- Positivas: el cliente paga sin intervención del personal y el recibo se emite al instante;
  el SRPP nunca ve datos de tarjeta.
- Negativas: nueva dependencia externa y una tabla más (`TransaccionPagoLinea`); si PayPhone
  no está disponible, el cliente vuelve al reporte con comprobante (HU-17).
