# ADR-006 · Firma custodial con separación de roles

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

Ni operadores ni clientes tienen wallet cripto, pero alguien debe firmar las transacciones
del contrato `RegistroRecibos`. La clave privada es el activo más sensible del sistema:
quien la posee puede anclar o anular recibos.

## Decisión

- **Firma custodial del lado del servidor**, aislada en el contenedor `worker`:
  `OPERATOR_PRIVATE_KEY` solo se monta ahí; el esquema de entorno del API **no incluye**
  esa variable.
- El aislamiento es **a nivel de despliegue**: la clave vive en `.env.worker`
  (`chmod 600`), que `compose.prod.yaml` inyecta exclusivamente en `worker`; el
  esquema de entorno del API es la segunda barrera.
- El API solo hace lecturas (`eth_call`) para la verificación pública.
- El contrato separa `DEFAULT_ADMIN_ROLE` (cuenta del despliegue, guardada con
  `hardhat-keystore` en la laptop del responsable, **fuera del servidor**) de
  `REGISTRADOR_ROLE` (cuenta operadora del worker, permisos mínimos).
- Concurrencia 1 + `nonceManager` de viem para evitar colisiones de nonce; tope de
  `maxFeePerGas` configurable.
- Rotación de la clave: anular el rol y otorgarlo a una cuenta nueva
  (`scripts/grant-registrador.ts`), sin actualizar el contrato.

## Alternativas descartadas

- **Wallet por usuario (MetaMask)**: contradice el requisito "nadie tiene wallet cripto".
- **Clave en el API**: duplica la superficie de ataque; una lectura indebida del proceso
  HTTP expondría la clave.
- **Custodia externa (KMS/HSM)**: correcto a escala empresarial, innecesario para el TFG
  y agrega dependencia/costo.
- **Multisig N de M**: complica la operación; el contrato actual no lo necesita.

## Consecuencias

- Positivas: el API no puede firmar aunque se vea comprometido; separación de privilegios
  admin/registrador; rotación simple.
- Negativas: un único punto de firma (el worker) y custodia de la clave (mitigado con rol
  mínimo, keystore y rotación).
