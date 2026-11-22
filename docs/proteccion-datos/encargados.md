# Encargados del tratamiento

Proveedores que tratan datos por cuenta de Oasis Seguros (responsable). Cada contrato o aceptación de
términos debe obligar al encargado a **avisar al responsable de toda vulneración en un máximo de 2
días** desde que la conoce, con su naturaleza, los datos afectados y las medidas tomadas
([plan-respuesta-incidentes.md](plan-respuesta-incidentes.md)). Revisión de los contratos: a validar
por Oasis.

| Encargado                | Servicio                                           | Datos que trata                                                                                             | Ubicación                      | Desde      | Referencia                      |
| ------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- | ------------------------------- |
| OVHcloud                 | Servidor VPS-1 donde corren todos los contenedores | Todos los del [inventario](insumos-eipd.md#1-inventario-de-datos): base, Redis, logs y respaldos locales    | Centro de datos a validar      | S7 (HT-06) | ARQUITECTURA §8, ADR-001        |
| Brevo                    | Envío de correo por SMTP                           | Correo y nombre del destinatario y contenido de la notificación (cuenta, pagos, recuperación de contraseña) | Unión Europea (a validar)      | S6 (HT-12) | ADR-023                         |
| Proveedor RPC de Polygon | Nodo JSON-RPC para leer y escribir el contrato     | Solo valores opacos (`idOnchain`, `hashRecibo`) y la IP del VPS; ningún dato personal (ADR-004)             | A validar según el proveedor   | S7 (HT-06) | ARQUITECTURA tabla 4-1, ADR-003 |
| Backblaze B2             | Almacenamiento externo de respaldos                | Volcado de la base y comprobantes, cifrados por restic antes de salir del VPS; B2 no tiene la contraseña    | Región a elegir (EE. UU. o UE) | S7 (HT-06) | ADR-026                         |

- **Proveedor RPC:** ARQUITECTURA (tabla 4-1) nombra a Alchemy; `docs/despliegue.md` §3 usa el RPC
  público de PublicNode con uno alternativo opcional. Oasis confirma cuál contrata.
- **Polygon PoS** no es un encargado: es una red pública donde solo quedan los dos valores opacos de
  cada recibo (ADR-004).
- Las transferencias internacionales que implican estos encargados se declaran en la
  [política](politica-tratamiento-datos-v1.0.md#8-transferencias).
