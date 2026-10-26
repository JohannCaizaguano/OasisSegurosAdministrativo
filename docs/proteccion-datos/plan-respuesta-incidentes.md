# Plan de respuesta a incidentes de datos personales

Aplica a toda vulneración de seguridad que afecte datos personales tratados por el SRPP. Marco: LOPDP
(Registro Oficial Suplemento 459, 26/05/2021) y su Reglamento; los artículos aplicables, a validar por
Oasis. Datos y sistemas afectables: [insumos-eipd.md](insumos-eipd.md). Encargados:
[encargados.md](encargados.md).

## 1. Roles

| Rol                 | Quién                                       | Responsabilidad                                                                  |
| ------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Responsable         | Gerencia de Oasis Seguros                   | Decide la notificación, firma los avisos a la Superintendencia y a los titulares |
| Responsable técnico | Desarrollador del SRPP                      | Detecta, contiene, rota secretos, recupera y documenta la evidencia técnica      |
| Encargado afectado  | Proveedor de [encargados.md](encargados.md) | Avisa al responsable en máximo 2 días y entrega la información del incidente     |

Contactos de cada rol: a completar por Oasis.

## 2. Clasificación y severidad

Cada incidente se clasifica por la propiedad afectada:

- **Confidencialidad:** acceso o divulgación no autorizada (fuga de la base, de un respaldo o de un
  secreto).
- **Integridad:** alteración no autorizada (un pago o recibo modificado; la verificación contra la
  cadena lo detecta como `HASH_INCONSISTENTE`, ADR-004).
- **Disponibilidad:** pérdida o indisponibilidad de los datos (caída o pérdida del VPS).

| Severidad | Criterio                                                                                      |
| --------- | --------------------------------------------------------------------------------------------- |
| Alta      | Datos personales de clientes expuestos o perdidos, o secreto que permite suplantar al sistema |
| Media     | Secreto expuesto sin evidencia de uso, o indisponibilidad mayor a 24 h sin pérdida de datos   |
| Baja      | Intento bloqueado o indisponibilidad breve, sin datos expuestos                               |

Toda severidad Alta o Media pasa a la evaluación de notificación (§5).

## 3. Contención por escenario

| Escenario                        | Contención                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuga de `OPERATOR_PRIVATE_KEY`   | Rotar la cuenta operadora y pausar el registro con `pnpm --filter @oasis/contracts rotar-operadora … --pausar` desde la billetera fría (HT-15, ADR-021); pasos en [despliegue.md §4.2](../despliegue.md#42-rotación-de-la-cuenta-operadora-ante-una-filtración). La clave no da acceso a datos personales (ADR-004, ADR-006). |
| Fuga de los secretos JWT         | Rotar `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` (§4): todo token firmado con ellos deja de validar. Para las cuentas sospechosas, restablecer la contraseña o desactivarlas, que ejecuta `cerrarTodas` (ADR-016, HU-04).                                                                                                     |
| Fuga de la base o de un respaldo | Rotar las credenciales de PostgreSQL, Redis y los secretos JWT (§4); identificar las tablas y los titulares afectados con [insumos-eipd.md §1](insumos-eipd.md#1-inventario-de-datos); evaluar la notificación (§5). Las sales expuestas no permiten alterar los recibos anclados, pero sí asociar cada hash a su recibo.     |
| Indisponibilidad del VPS         | Restaurar desde el respaldo local de 7 días o desde el externo cifrado de 30 días (HT-06, S7; ADR-026; [despliegue.md §5](../despliegue.md#5-backups)). Los recibos ya anclados siguen verificables en la cadena.                                                                                                             |
| Incidente en un encargado        | Pedir al encargado el alcance, rotar las credenciales compartidas con él (§4) y seguir el escenario que corresponda.                                                                                                                                                                                                          |

## 4. Rotación de secretos

Variables de [`.env.example`](../../.env.example) y [`.env.worker.example`](../../.env.worker.example)
que son secretos. En producción viven en `/opt/oasis/.env` y `/opt/oasis/.env.worker`
([despliegue.md §3](../despliegue.md#3-archivos-en-el-vps)).

| Variable                                                                 | Dónde se rota                                                                  | Qué se reinicia            |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------- |
| `POSTGRES_PASSWORD` y `DATABASE_URL`                                     | `ALTER ROLE` en PostgreSQL y ambas variables en `.env`                         | `api`, `worker`, `migrate` |
| `REDIS_PASSWORD`                                                         | `.env`; Redis la exige desde HT-05 (S7)                                        | `redis`, `api`, `worker`   |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`                                | `.env`, con `openssl rand -hex 32`; todos los usuarios inician sesión otra vez | `api`                      |
| `OPERATOR_PRIVATE_KEY`                                                   | Cuenta nueva con REGISTRADOR_ROLE y `.env.worker` (§3)                         | `worker`                   |
| `RPC_URL`, `RPC_URL_FALLBACK`                                            | Panel del proveedor RPC si la URL lleva una llave de API, y `.env`             | `api`, `worker`            |
| `GRAFANA_ADMIN_PASSWORD`                                                 | Interfaz de Grafana (la variable solo aplica al crear su volumen) y `.env`     | ninguno                    |
| `SEED_ADMIN_PASSWORD`, `SEED_OPERADOR_PASSWORD`, `SEED_CLIENTE_PASSWORD` | Solo los lee el seed; se cambia la contraseña de la cuenta en el SRPP          | ninguno                    |

Las demás variables de ambos archivos son configuración, no secretos. Fuera de ellos también se rotan,
si están comprometidos: las claves de `hardhat keystore` ([despliegue.md §4](../despliegue.md#4-despliegue-del-contrato-en-amoy)),
las credenciales SMTP del worker (ADR-023, S6), las de restic y B2 en `/etc/oasis/restic.env`
(ADR-026, S7), el token de GHCR y la llave SSH de despliegue.

## 5. Notificación

1. El responsable técnico entrega al responsable el registro del incidente (§6) con los titulares y
   datos afectados.
2. El responsable notifica a la Superintendencia de Protección de Datos Personales por el SISPDP en un
   **máximo de 5 días** desde que conoce la vulneración.
3. Si la vulneración puede afectar los derechos de los titulares, el responsable les comunica sin
   dilación indebida con la [plantilla](plantilla-comunicacion-titular.md).
4. Un encargado afectado avisa al responsable en un **máximo de 2 días** ([encargados.md](encargados.md)).

## 6. Registro y lecciones aprendidas

Cada incidente, notificado o no, se registra con: fecha y hora de detección y de conocimiento,
clasificación y severidad, sistemas y datos afectados, número de titulares, medidas de contención,
secretos rotados, notificaciones enviadas (con fecha) y cierre. La bitácora de auditoría
(`BitacoraAuditoria`, de solo inserción, ADR-013) y los logs del API y del worker son la evidencia
técnica. Al cerrar, una revisión de lecciones aprendidas actualiza este plan, el
[registro de actividades](registro-actividades-tratamiento.md) o los controles de
[insumos-eipd.md](insumos-eipd.md). Dónde se guarda el registro de incidentes: a definir por Oasis.
