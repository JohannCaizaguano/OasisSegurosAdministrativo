# ADR-004 · Ningún dato personal en la blockchain

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

La blockchain es pública, permanente e inmutable. Publicar nombres, cédulas, correos,
montos o números de póliza violaría la privacidad del asegurado (y el principio de
minimización de la LOPDP), además de crear un registro imposible de rectificar. A la vez,
el cliente, el personal o un auditor deben poder comprobar que un recibo no fue alterado.

## Decisión

La cadena solo recibe **dos valores opacos de 32 bytes**:

- `idOnchain = keccak256(uuid del recibo)` — identificador sin significado;
- `hashRecibo = keccak256(sal ‖ payloadCanónico)` — huella del contenido, con **sal
  aleatoria de 32 bytes que nunca sale de PostgreSQL**.

El payload canónico (RFC 8785) guardado en la base de datos incluye código, `pagoId`,
número de póliza, monto, moneda, fecha de pago y `emitidoEn`; **nunca** datos personales.
La verificación pública recalcula el hash y lo compara con el de la cadena, devolviendo
solo código, hashes, estado, `txHash` y enlace al explorador. Aunque alguien adivinara el
payload, sin la sal no puede reproducir el hash (defensa ante diccionario).

## Alternativas descartadas

- **Guardar el payload completo on-chain**: filtración irreversible y gas alto.
- **Hash sin sal**: permite ataques de diccionario (montos y fechas son predecibles).
- **IPFS con payload cifrado**: añade infraestructura y complica la verificación pública
  que solo requiere "recibo íntegro y del emisor correcto".
- **Almacenamiento off-chain firmado (sin cadena)**: no aporta prueba pública e inmutable
  de tiempo.

## Consecuencias

- Positivas: minimización de datos; verificación pública sin exponer datos; hash
  resistente a diccionario; la base de datos permite rectificaciones.
- Negativas: la sal es un secreto operativo (respaldo de la BD crítico); si se pierde el
  payload o la sal, la verificación falla (`NO_ANCLADO`/`HASH_INCONSISTENTE`) aunque el
  anclaje exista.
