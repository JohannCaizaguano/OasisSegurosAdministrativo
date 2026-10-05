# Registro de decisiones de arquitectura (ADR)

Un archivo por decisión, en formato corto: **Contexto · Decisión · Alternativas
descartadas · Consecuencias · Estado**. Los IDs coinciden con la tabla 11-1 de
`docs/referencia/ARQUITECTURA.md`; la numeración no se reutiliza.

| ADR     | Decisión                                                                | Sprint | Archivo                                     |
| ------- | ----------------------------------------------------------------------- | ------ | ------------------------------------------- |
| ADR-001 | Monolito modular en contenedores con Docker Compose en un VPS           | S1     | `ADR-001-monolito-modular-compose.md`       |
| ADR-002 | Arquitectura hexagonal por módulo, verificada con dependency-cruiser    | S1     | `ADR-002-arquitectura-hexagonal.md`         |
| ADR-003 | Red Polygon PoS; red de pruebas Amoy                                    | S2     | `ADR-003-polygon-pos-amoy.md`               |
| ADR-004 | En la cadena se registran solo un identificador opaco y un hash con sal | S2     | `ADR-004-sin-datos-personales-onchain.md`   |
| ADR-005 | Anclaje asíncrono con outbox transaccional y cola BullMQ                | S7     | `ADR-005-outbox-bullmq.md`                  |
| ADR-006 | Firma de transacciones con una cuenta operadora del bróker              | S7     | `ADR-006-firma-custodial.md`                |
| ADR-007 | API y worker como procesos y contenedores separados                     | S7     | _pendiente (se redacta en su sprint)_       |
| ADR-008 | Contrato inmutable, sin proxy actualizable                              | S2     | `ADR-008-contrato-inmutable.md`             |
| ADR-009 | Caddy como punto de entrada único: SPA, proxy del API y TLS             | S12    | `ADR-009-caddy-mismo-origen.md`             |
| ADR-010 | Modelo de datos completo en la migración inicial                        | S1     | `ADR-010-modelo-datos-migracion-inicial.md` |
| ADR-011 | Alcance mínimo de `compose.dev.yaml` en el Sprint 1                     | S1     | `ADR-011-alcance-compose-dev-sprint-1.md`   |
| ADR-012 | `/health` con Terminus, dentro del prefijo `/api/v1`                    | S1     | `ADR-012-health-terminus-y-prefijo.md`      |
| ADR-013 | Bitácora de auditoría declarativa y de solo inserción                   | S2     | `ADR-013-bitacora-auditoria.md`             |

> Nota: los ADR-003 a ADR-006 y ADR-009 ya existían en el repositorio con numeración
> local `0001`–`0006`; en el Sprint 1 se renumeraron a los IDs de la arquitectura para
> que la tesis y el código citen el mismo identificador.
