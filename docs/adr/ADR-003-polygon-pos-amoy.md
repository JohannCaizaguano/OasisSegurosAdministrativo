# ADR-003 · Polygon PoS (testnet Amoy) para el anclaje

- **Estado**: aceptado
- **Fecha**: 2026-09

## Contexto

El hash de cada recibo debe anclarse en una blockchain pública e inmutable, accesible desde
Ecuador, sin que los usuarios tengan que custodiar criptomonedas.

## Decisión

Usar **Polygon PoS**, testnet **Amoy (chainId 80002)** en desarrollo y evaluación; en
producción solo cambian `CHAIN_ID` (137) y la URL del RPC. Es compatible con EVM (Solidity,
viem y OpenZeppelin), tiene costos bajos y finalidad rápida, un explorador público
(amoy.polygonscan.com) y verificación de contratos con Etherscan V2.

## Alternativas descartadas

- **Ethereum mainnet**: costos desproporcionados para un trabajo de titulación.
- **Redes no EVM (Solana, Stellar)**: otro ecosistema de herramientas y de auditoría.
- **Blockchain privada/permissioned**: impide comprobar cada anclaje en un explorador
  independiente sin confiar en el bróker.
- **Anchoring por lotes (Merkle)**: más eficiente, pero complica la verificación por
  recibo individual. Queda como evolución posible.

## Consecuencias

- Positivas: contrato inmutable sin proxy; verificación pública desde el explorador;
  misma base de código para local (Hardhat) y Amoy.
- Negativas: costo por gas (mitigado con `maxFeePerGas` acotado); dependencia de un
  proveedor RPC (mitigada con `RPC_URL_FALLBACK` y el transporte `fallback` de viem).
