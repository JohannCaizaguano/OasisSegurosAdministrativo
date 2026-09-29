# ADR-003 · Polygon PoS (testnet Amoy) para el anclaje

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

El hash de cada recibo debe anclarse en una blockchain pública, inmutable y accesible en
Ecuador sin custodia de cripto por parte del bróker. La evaluación es en 2026 y el
sistema se despliega en un VPS modesto.

## Decisión

Usar **Polygon PoS**, testnet **Amoy (chainId 80002)** en desarrollo y evaluación; en
producción se cambia solo `CHAIN_ID` (137) y la URL del RPC. Razones: EVM compatible
(Solidity + viem + OpenZeppelin sin fricción), costos bajos y finalidad rápida en PoS,
explorador público (amoy.polygonscan.com) y verificación de contratos vía Etherscan V2.

## Alternativas descartadas

- **Ethereum mainnet**: costos desproporcionados para un TFG.
- **Redes no-EVM (Solana, Stellar)**: otro ecosistema de herramientas y auditoría; más
  riesgo y menos reutilización de conocimiento.
- **Blockchain privada/permissioned**: contradice la verificación pública por terceros
  sin confiar en el bróker.
- **Anchoring por lotes (Merkle)**: más eficiente, pero complica la verificación por
  recibo individual; evolución posible a futuro.

## Consecuencias

- Positivas: contrato inmutable sin proxy; verificación pública desde el explorador;
  misma base de código para local (Hardhat) y Amoy.
- Negativas: costo por gas (mitigado con `maxFeePerGas` acotado); dependencia de un
  proveedor RPC (mitigada con `RPC_URL_FALLBACK` y el transporte `fallback` de viem).
