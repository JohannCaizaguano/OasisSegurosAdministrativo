# ADR 0002 · Polygon PoS (testnet Amoy) para el anclaje

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

El hash de cada recibo debe anclarse en una blockchain pública, inmutable y accesible
en Ecuador sin custodia de cripto por parte del bróker. La evaluación se hace en 2026;
el sistema se despliega en un VPS modesto.

## Decisión

Usar **Polygon PoS**, testnet **Amoy (chainId 80002)** durante el desarrollo y la
evaluación. En producción se cambia solo `CHAIN_ID` (137) y la URL del RPC.

Razones: EVM compatible (solidity + viem + OpenZeppelin sin fricción), costos bajos y
finalidad rápida en PoS, explorador público (amoy.polygonscan.com), y API de verificación
de contratos compatible con Etherscan V2.

## Alternativas descartadas

- **Ethereum mainnet**: costos desproporcionados para un TFG.
- **Redes no-EVM (Solana, Stellar)**: ecosistema de herramientas y auditoría distinto;
  más riesgo y menos reutilización de conocimiento.
- **Blockchain privada/permissioned**: contradice el objetivo de verificación pública
  por terceros sin confiar en el bróker.
- **Anchoring por lotes (Merkle)**: más eficiente, pero complica la verificación por
  recibo individual; se puede evolucionar en el futuro.

## Consecuencias

- Positivas: contrato inmutable sin proxy; verificación pública desde el explorador;
  misma base de código para local (Hardhat) y Amoy.
- Negativas: costo por gas (mitigado con `maxFeePerGas` acotado); dependencia de un
  proveedor RPC (mitigado con `RPC_URL_FALLBACK` y transporte `fallback` de viem).
