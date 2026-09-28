# C4 · Nivel 1: Contexto

Oasis Seguros es un bróker de seguros ecuatoriano. El sistema administrativo gestiona
clientes, pólizas, pagos y **recibos verificables en blockchain**: cuando un operador
valida un pago, el sistema emite un recibo y ancla su hash en **Polygon PoS (testnet
Amoy)**. Cualquier persona puede comprobar un recibo desde una página pública.

```mermaid
flowchart LR
  operador["OPERADOR / ADMIN<br/>(personal del bróker)"]
  cliente["CLIENTE<br/>(asegurado)"]
  publico["Público general<br/>(verificador)"]
  sistema["Sistema Oasis Seguros<br/>[Software]<br/>SPA + API + worker<br/>+ PostgreSQL + Redis"]
  polygon["Polygon PoS (Amoy)<br/>[Sistema externo]<br/>Contrato RegistroRecibos"]
  explorador["Polygonscan (Amoy)<br/>[Sistema externo]"]
  rpc["Proveedor RPC<br/>[Sistema externo]"]

  operador -- "HTTPS: gestiona clientes,<br/>pólizas, pagos y recibos" --> sistema
  cliente -- "HTTPS: consulta sus pólizas y pagos" --> sistema
  publico -- "HTTPS: verifica un recibo por código o QR" --> sistema
  sistema -- "viem: registrar(id, hash), anular, verificar" --> polygon
  sistema -- "JSON-RPC (fallback)" --> rpc
  publico -- "enlaces a transacciones" --> explorador

  note["Regla crítica: en la cadena solo viajan<br/>idOnchain (bytes32) y hashRecibo (bytes32).<br/>Ningún dato personal."]
  sistema --- note
```

## Actores y necesidades

| Actor    | Necesidad                                                               |
| -------- | ----------------------------------------------------------------------- |
| ADMIN    | Administrar el sistema, reintentar/anular anclajes, ver métricas.       |
| OPERADOR | Registrar clientes, pólizas y pagos; validar pagos para emitir recibos. |
| CLIENTE  | Consultar sus pólizas y el estado de sus pagos.                         |
| Público  | Verificar la autenticidad de un recibo sin cuenta ni login.             |

## Sistemas externos

- **Polygon PoS / Amoy**: red donde vive el contrato inmutable `RegistroRecibos`.
- **Proveedor RPC**: acceso JSON-RPC (con URL de respaldo configurable).
- **Polygonscan Amoy**: explorador de bloques para los enlaces públicos.
