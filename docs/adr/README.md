# Registro de decisiones de arquitectura (ADR)

Un archivo por decisión, con las secciones Contexto, Decisión, Alternativas descartadas,
Consecuencias y Estado. Los IDs son los de la tabla 11-1 de `docs/referencia/ARQUITECTURA.md`
y no se reutilizan.

| ADR     | Decisión                                                                      | Sprint  | Archivo                                     |
| ------- | ----------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| ADR-001 | Monolito modular en contenedores con Docker Compose en un VPS                 | S1      | `ADR-001-monolito-modular-compose.md`       |
| ADR-002 | Arquitectura hexagonal por módulo, verificada con dependency-cruiser          | S1      | `ADR-002-arquitectura-hexagonal.md`         |
| ADR-003 | Red Polygon PoS; red de pruebas Amoy                                          | S2      | `ADR-003-polygon-pos-amoy.md`               |
| ADR-004 | En la cadena se registran solo un identificador opaco y un hash con sal       | S2      | `ADR-004-sin-datos-personales-onchain.md`   |
| ADR-005 | Anclaje asíncrono con outbox transaccional y cola BullMQ                      | S7      | `ADR-005-outbox-bullmq.md`                  |
| ADR-006 | Firma de transacciones con una cuenta operadora del bróker                    | S7      | `ADR-006-firma-custodial.md`                |
| ADR-007 | API y worker como procesos y contenedores separados                           | S7      | _pendiente (se redacta en su sprint)_       |
| ADR-008 | Contrato inmutable, sin proxy actualizable                                    | S2      | `ADR-008-contrato-inmutable.md`             |
| ADR-009 | Caddy como punto de entrada único: SPA, proxy del API y TLS                   | S12     | `ADR-009-caddy-mismo-origen.md`             |
| ADR-010 | Modelo de datos completo en la migración inicial                              | S1      | `ADR-010-modelo-datos-migracion-inicial.md` |
| ADR-011 | Alcance mínimo de `compose.dev.yaml` en el Sprint 1                           | S1      | `ADR-011-alcance-compose-dev-sprint-1.md`   |
| ADR-012 | `/health` con Terminus, dentro del prefijo `/api/v1`                          | S1      | `ADR-012-health-terminus-y-prefijo.md`      |
| ADR-013 | Bitácora de auditoría declarativa y de solo inserción                         | S2      | `ADR-013-bitacora-auditoria.md`             |
| ADR-014 | Pago en línea con la Cajita de Pagos de PayPhone, confirmado desde el backend | S12     | `ADR-014-pago-en-linea-payphone.md`         |
| ADR-015 | Acceso solo con inicio de sesión; sin página pública de verificación          | S3 y S8 | `ADR-015-acceso-solo-autenticado.md`        |
| ADR-016 | Sesiones por familia de rotación con cierre por inactividad en Redis          | S3      | `ADR-016-sesiones-redis.md`                 |
| ADR-017 | Validación de identificaciones ecuatorianas (RN-11)                           | S4      | `ADR-017-validacion-identificaciones.md`    |
| ADR-018 | Ciclo de vida de la póliza: estados terminales y edición restringida          | S5      | `ADR-018-ciclo-vida-poliza.md`              |
