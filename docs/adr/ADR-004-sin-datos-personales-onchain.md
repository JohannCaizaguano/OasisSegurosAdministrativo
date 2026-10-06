# ADR-004 · Ningún dato personal en la blockchain

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

La blockchain es pública, permanente e inmutable. Publicar nombres, cédulas, correos,
montos o números de póliza violaría la privacidad del asegurado y el principio de
minimización de la LOPDP, y dejaría un registro imposible de rectificar. Aun así, el
cliente, el personal o un auditor deben poder comprobar que un recibo no fue alterado.

## Decisión

La cadena solo recibe **dos valores opacos de 32 bytes**:

- `idOnchain = keccak256(uuid del recibo)`: identificador sin significado;
- `hashRecibo = keccak256(sal ‖ payloadCanónico)`: huella del contenido, con una sal
  aleatoria de 32 bytes que solo se guarda en PostgreSQL.

El payload canónico (RFC 8785) guardado en la base de datos incluye código, `pagoId`,
número de póliza, monto, moneda, fecha de pago y `emitidoEn`, sin datos personales. La
verificación recalcula el hash, lo compara con el de la cadena y devuelve solo código,
hashes, estado, `txHash` y enlace al explorador. Quien adivine el payload no puede
reproducir el hash sin la sal, lo que impide los ataques de diccionario.

## Alternativas descartadas

- **Guardar el payload completo on-chain**: filtración irreversible y gas alto.
- **Hash sin sal**: permite ataques de diccionario (montos y fechas son predecibles).
- **IPFS con payload cifrado**: añade infraestructura y complica una verificación que solo
  necesita saber si el recibo está íntegro y lo emitió el bróker.
- **Almacenamiento off-chain firmado (sin cadena)**: no aporta prueba pública e inmutable
  de tiempo.

## Consecuencias

- Positivas: minimización de datos; verificación sin exponer datos; hash resistente a
  diccionario; la base de datos admite rectificaciones.
- Negativas: la sal es un secreto operativo, así que el respaldo de la BD es crítico; si se pierde el
  payload o la sal, la verificación falla (`NO_ANCLADO`/`HASH_INCONSISTENTE`) aunque el
  anclaje exista.
