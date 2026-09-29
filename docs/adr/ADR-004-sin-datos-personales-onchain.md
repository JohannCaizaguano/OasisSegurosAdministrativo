# ADR-004 · Ningún dato personal en la blockchain

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

La blockchain es pública, permanente e inmutable. Publicar nombres, cédulas, correos,
montos o números de póliza violaría la privacidad del asegurado (y, en Ecuador, el
principio de minimización de datos de la LOPDP), además de crear un registro
imposible de rectificar. A la vez, un verificador externo debe poder comprobar que un
recibo concreto no fue alterado.

## Decisión

La cadena solo recibe **dos valores opacos de 32 bytes**:

- `idOnchain = keccak256(uuid del recibo)` — identificador sin significado;
- `hashRecibo = keccak256(sal ‖ payloadCanónico)` — huella del contenido, con **sal
  aleatoria de 32 bytes que nunca sale de PostgreSQL**.

El payload canónico (RFC 8785) que se guarda en la base de datos incluye código, `pagoId`,
número de póliza, monto, moneda, fecha de pago y `emitidoEn`; **nunca** datos personales.
La verificación pública recalcula el hash y lo compara con el de la cadena, pero devuelve
solo código, hashes, estado, `txHash` y enlace al explorador.

Defensa adicional: aunque alguien adivinara el payload, sin la sal no puede reproducir el
hash (evita ataques de diccionario sobre combinaciones predecibles).

## Alternativas descartadas

- **Guardar el payload completo on-chain**: filtración irreversible; costo de gas alto.
- **Hash sin sal**: permite ataques de diccionario (montos y fechas son predecibles).
- **IPFS con payload cifrado**: añade infraestructura y complica la verificación pública
  que solo requiere "recibo íntegro y del emisor correcto".
- **Almacenamiento off-chain firmado (sin cadena)**: no aporta prueba pública e inmutable
  de tiempo.

## Consecuencias

- Positivas: cumplimiento de minimización; verificación pública sin exponer datos;
  el hash con sal es resistente a diccionario; la base de datos sigue siendo la fuente
  de los datos personales y permite rectificaciones.
- Negativas: la sal es un secreto operativo (respaldo de la BD crítico); si se pierde el
  payload o la sal, la verificación falla (`NO_ANCLADO`/`HASH_INCONSISTENTE`) aunque el
  anclaje exista.
