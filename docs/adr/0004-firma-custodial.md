# ADR 0004 · Firma custodial con separación de roles

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

Ni los operadores ni los clientes tienen wallet cripto. Alguien debe firmar las
transacciones del contrato `RegistroRecibos`. La clave privada es el activo más sensible
del sistema: quien la posee puede anclar o anular recibos.

## Decisión

- **Firma custodial del lado del servidor**, aislada en el contenedor `worker`:
  `OPERATOR_PRIVATE_KEY` solo se monta en ese contenedor; el esquema de entorno del API
  **no incluye** esa variable.
- El API únicamente realiza lecturas (`eth_call`) para la verificación pública.
- El contrato separa `DEFAULT_ADMIN_ROLE` (cuenta del despliegue, guardada con
  `hardhat-keystore` en la laptop del responsable, **fuera del servidor**) de
  `REGISTRADOR_ROLE` (cuenta operadora del worker, con permisos mínimos).
- Concurrencia 1 + `nonceManager` de viem para evitar colisiones de nonce; tope de
  `maxFeePerGas` configurable.
- La clave operadora se rota anulando el rol y otorgándolo a una cuenta nueva
  (`scripts/grant-registrador.ts`), sin necesidad de actualizar el contrato.

## Alternativas descartadas

- **Wallet por usuario (MetaMask)**: contradice el requisito "nadie tiene wallet cripto".
- **Clave en el API**: duplica la superficie de ataque; cualquier lectura indebida del
  proceso HTTP expondría la clave.
- **Servicio de custodia externo (KMS/HSM)**: correcto a escala empresarial, innecesario
  para el alcance del TFG y agrega dependencia/costo.
- **Multisig de N de M**: complica la operación; el contrato actual no lo necesita.

## Consecuencias

- Positivas: el API no puede firmar (incluso si se ve comprometido); separación de
  privilegios admin/registrador; rotación simple.
- Negativas: un único punto de firma (el worker) y custodia de la clave (se documenta la
  gestión con keystore y fondos mínimos); si el worker se compromete, la cuenta
  operadora puede anclar/ anular (mitigado con rol mínimo y rotación).
