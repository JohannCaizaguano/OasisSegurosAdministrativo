# Registro de actividades de tratamiento

**Responsable:** Oasis Seguros, bróker de seguros (Quito, Ecuador); RUC, domicilio y delegado de
protección de datos: a completar por Oasis. **Sistema:** SRPP. **Marco:** LOPDP (Registro Oficial
Suplemento 459, 26/05/2021) y su Reglamento. Las bases de legitimación y los plazos legales de
conservación son una propuesta técnica, a validar por Oasis. El detalle de cada campo está en
[insumos-eipd.md](insumos-eipd.md#1-inventario-de-datos) y los encargados, en
[encargados.md](encargados.md).

## 1. Actividades

| #   | Actividad y finalidad                                                                      | Titulares                    | Categorías de datos                                                                       | Base de legitimación (propuesta)                         |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| A1  | Gestión de clientes y pólizas: identificar al asegurado y administrar sus pólizas y cuotas | Clientes                     | Identificación (tipo y número), nombres o razón social, correo, teléfono; datos de póliza | Ejecución del contrato de intermediación de seguros      |
| A2  | Registro y validación de pagos y emisión de recibos                                        | Clientes                     | Pagos (monto, fecha, método, referencia, comprobante), recibos                            | Ejecución del contrato; obligación legal                 |
| A3  | Anclaje y verificación de recibos en Polygon (ADR-004)                                     | Clientes                     | Ningún dato personal en la cadena; el contenido del recibo y su sal quedan en PostgreSQL  | Interés legítimo en la integridad verificable del recibo |
| A4  | Cuentas de acceso y sesiones                                                               | Personal de Oasis y clientes | Correo, nombre, rol, hash de contraseña, aceptación de la política, sesiones              | Ejecución del contrato; consentimiento (HU-33, S6)       |
| A5  | Auditoría y seguridad: bitácora de acciones y logs                                         | Personal de Oasis y clientes | Usuario, acción, entidad, IP, fecha; logs técnicos con IP y `requestId`                   | Interés legítimo; obligación de seguridad de la LOPDP    |
| A6  | Notificaciones por correo (ADR-023, S6)                                                    | Personal de Oasis y clientes | Correo, nombre y contenido de la notificación                                             | Ejecución del contrato                                   |
| A7  | Respaldos y recuperación (ADR-026, S7)                                                     | Todos los anteriores         | Copia completa de la base y de los comprobantes, cifrada                                  | Obligación de seguridad de la LOPDP                      |
| A8  | Atención de solicitudes del titular (HU-53, S6)                                            | Clientes                     | Datos de la solicitud y de su resolución                                                  | Obligación legal                                         |

No se tratan datos sensibles ni de menores de forma intencional. Las aseguradoras son personas
jurídicas registradas como datos de la póliza.

## 2. Conservación

| Datos                                      | Plazo                                                                                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clientes, pólizas, cuotas, pagos y recibos | No se borran (RN-09); se conservan mientras dure la relación y el plazo legal de conservación (a validar por Oasis). Ante una solicitud de eliminación se anonimizan y se borran el contenido y la sal del recibo (HU-53) |
| Cuentas de usuario                         | Mientras estén activas; al desactivarse se conservan por la trazabilidad de la bitácora                                                                                                                                   |
| Bitácora de auditoría                      | Al menos 1 año (ARQUITECTURA §10.2); de solo inserción (ADR-013)                                                                                                                                                          |
| Sesiones en Redis                          | Expiran a los 30 min de inactividad; la familia de renovación, a los 7 días (ADR-016)                                                                                                                                     |
| Tokens de recuperación de contraseña       | Válidos 30 min, guardados como hash (ARQUITECTURA §10.2; HU-31, S7)                                                                                                                                                       |
| Trabajos de correo en Redis                | Hasta completarse; los fallidos, 7 días (ADR-023)                                                                                                                                                                         |
| Logs de los contenedores                   | Rotación por tamaño: 3 archivos de 10 MB por servicio (`compose.prod.yaml`)                                                                                                                                               |
| Respaldos                                  | 7 días en el VPS y 30 días cifrados en Backblaze B2 (ADR-026)                                                                                                                                                             |

## 3. Destinatarios

- **Encargados:** OVHcloud, Brevo, el proveedor RPC de Polygon y Backblaze B2 ([encargados.md](encargados.md)).
- **Aseguradoras:** intercambian con Oasis los datos de las pólizas y de los pagos fuera del SRPP
  (HU-50 carga sus notificaciones de pago); el SRPP no les da acceso (ADR-015). A validar por Oasis.
- **Público:** solo los valores opacos de cada recibo en Polygon PoS (ADR-004).
- **Autoridades:** cuando una obligación legal lo exija.
