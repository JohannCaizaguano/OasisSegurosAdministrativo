# ADR-013 · Bitácora de auditoría declarativa y de solo inserción

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: 2

## Contexto

HU-45 (RF-50, RNF-27 y RN-17) pide registrar creación, modificación, validación, rechazo,
anulación, inicio de sesión e importación con usuario, fecha, IP, entidad y acción. Los registros
no se modifican ni se eliminan y se conservan al menos un año. La tabla `BitacoraAuditoria` ya
existe (ADR-010) con `usuarioId` obligatorio, y las mutaciones viven en controladores de seis
módulos.

## Decisión

- Catálogo cerrado en `@oasis/shared`: `ACCIONES_AUDITORIA` y `ENTIDADES_AUDITADAS` (nombres de
  los modelos de Prisma).
- Captura declarativa: cada endpoint que modifica datos lleva `@Auditar(accion, entidad)`, y
  `AuditoriaInterceptor` (global, declarado en `AuditoriaModule`) inserta el registro después de
  que el handler termina con éxito y antes de responder. Una prueba falla si una mutación HTTP
  queda sin decorador.
- El usuario sale de `req.user`; en el inicio de sesión, de la respuesta. Solo se registran los
  inicios exitosos.
- `detalle` guarda método, ruta, `requestId` y, en MODIFICAR, los nombres de los campos enviados:
  nunca valores ni datos personales.
- Inmutabilidad en dos capas: el puerto solo ofrece `registrar` y `listar`, y el trigger
  `bitacora_solo_insercion` rechaza UPDATE, DELETE y TRUNCATE.
- Consulta: `GET /api/v1/bitacora` (ADMIN), con filtros por usuario, acción y fechas de Ecuador
  (UTC−5).

## Alternativas descartadas

- **Registro explícito en cada caso de uso, en la misma transacción**: es atómico, pero cambia una
  docena de firmas y obliga a compartir transacciones entre repositorios.
- **Triggers de auditoría sobre las tablas de negocio**: no conocen al usuario ni la IP sin pasar
  contexto a la sesión de PostgreSQL, y no cubren el inicio de sesión.
- **Usuario de base de datos sin permisos de UPDATE y DELETE**: cambia compose, credenciales y
  despliegue; el trigger da la misma garantía con una sola migración.
- **Instantáneas de antes y después**: duplicarían datos personales en un registro que no se puede
  borrar (LOPDP).

## Consecuencias

- Positivas: una línea por endpoint; las historias futuras solo agregan el decorador; RN-17 se
  demuestra contra la base de datos.
- Negativas: el registro no es atómico con la operación. Si la inserción falla después del commit,
  la acción queda solo en el log de pino con su `requestId`. Los intentos fallidos de inicio de
  sesión quedan en el log, no en la bitácora. La conservación de un año se cumple porque nada se
  borra; los respaldos llegan con HT-06 (S13).
