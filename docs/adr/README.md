# Registro de decisiones de arquitectura (ADR)

Un archivo por decisión, con las secciones Contexto, Decisión, Alternativas descartadas,
Consecuencias y Estado. Los IDs son los de la tabla 11-1 de `docs/referencia/ARQUITECTURA.md`
y no se reutilizan.

| ADR     | Decisión                                                                       | Sprint  | Archivo                                     |
| ------- | ------------------------------------------------------------------------------ | ------- | ------------------------------------------- |
| ADR-001 | Monolito modular en contenedores con Docker Compose en un VPS                  | S1      | `ADR-001-monolito-modular-compose.md`       |
| ADR-002 | Arquitectura hexagonal por módulo, verificada con dependency-cruiser           | S1      | `ADR-002-arquitectura-hexagonal.md`         |
| ADR-003 | Red Polygon PoS; red de pruebas Amoy                                           | S1      | `ADR-003-polygon-pos-amoy.md`               |
| ADR-004 | En la cadena se registran solo un identificador opaco y un hash con sal        | S1      | `ADR-004-sin-datos-personales-onchain.md`   |
| ADR-005 | Anclaje asíncrono con outbox transaccional y cola BullMQ                       | S4      | `ADR-005-outbox-bullmq.md`                  |
| ADR-006 | Firma de transacciones con una cuenta operadora del bróker                     | S4      | `ADR-006-firma-custodial.md`                |
| ADR-007 | API y worker como procesos y contenedores separados                            | S4      | `ADR-007-api-worker-separados.md`           |
| ADR-008 | Contrato inmutable, sin proxy actualizable                                     | S1      | `ADR-008-contrato-inmutable.md`             |
| ADR-009 | Caddy como punto de entrada único: SPA, proxy del API y TLS                    | S7      | `ADR-009-caddy-mismo-origen.md`             |
| ADR-010 | Modelo de datos completo en la migración inicial                               | S1      | `ADR-010-modelo-datos-migracion-inicial.md` |
| ADR-011 | Alcance mínimo de `compose.dev.yaml` en el Sprint 1                            | S1      | `ADR-011-alcance-compose-dev-sprint-1.md`   |
| ADR-012 | `/health` con Terminus, dentro del prefijo `/api/v1`                           | S1      | `ADR-012-health-terminus-y-prefijo.md`      |
| ADR-013 | Bitácora de auditoría declarativa y de solo inserción                          | S1      | `ADR-013-bitacora-auditoria.md`             |
| ADR-014 | Pago en línea con la Cajita de Pagos de PayPhone (retirada en el backlog v1.5) | —       | `ADR-014-pago-en-linea-payphone.md`         |
| ADR-015 | Acceso solo con inicio de sesión; sin página pública de verificación           | S2 y S5 | `ADR-015-acceso-solo-autenticado.md`        |
| ADR-016 | Sesiones por familia de rotación con cierre por inactividad en Redis           | S2      | `ADR-016-sesiones-redis.md`                 |
| ADR-017 | Validación de identificaciones ecuatorianas (RN-11)                            | S2      | `ADR-017-validacion-identificaciones.md`    |
| ADR-018 | Ciclo de vida de la póliza: estados terminales y edición restringida           | S3      | `ADR-018-ciclo-vida-poliza.md`              |
| ADR-019 | Diseño de interfaz Claroscuro (estructura de C con el negro y oro del manual)  | S4      | `ADR-019-diseno-interfaz-claroscuro.md`     |
| ADR-020 | Plan de cuotas y saldo de la póliza                                            | S4      | `ADR-020-plan-cuotas-saldo.md`              |
| ADR-021 | Administración del contrato con billetera fría                                 | S4      | `ADR-021-administracion-contrato-fria.md`   |
| ADR-022 | Importación de cartera en el servidor con vista previa                         | S6      | `ADR-022-importacion-cartera.md`            |
| ADR-023 | Notificaciones por correo desde el worker                                      | S6      | `ADR-023-notificaciones-correo.md`          |
| ADR-024 | Carga de pagos notificados por la aseguradora                                  | S7      | `ADR-024-carga-pagos-aseguradora.md`        |
| ADR-025 | Almacenamiento y entrega de comprobantes                                       | S7      | `ADR-025-comprobantes.md`                   |
| ADR-026 | Respaldos cifrados con restic en almacenamiento externo                        | S7      | `ADR-026-respaldos-restic.md`               |
| ADR-027 | Segundo factor TOTP para el administrador                                      | S8      | `ADR-027-segundo-factor-totp.md`            |
| ADR-028 | Generación de reportes en CSV y PDF en el servidor                             | S8      | `ADR-028-reportes-csv-pdf.md`               |

Las ADR-020 a ADR-028 se redactaron el 23/10/2026 con los planes de S4 a S9: registran decisiones
ya tomadas y se actualizan en su sprint si la implementación las cambia.
