# Sprint S2 — Acceso y sesiones, base de la SPA, usuarios del personal, clientes y aseguradoras

- **Historias:** HU-01 Iniciar sesión (8 h), HU-02 Cerrar sesión (3 h), HU-03 Control de acceso por
  rol (6 h), HU-06 Cambiar contraseña (3 h), HU-32 Cierre de sesión por inactividad (2 h), HT-04
  Base del frontend con shadcn/ui (10 h), HU-04 Gestionar usuarios del personal (5 h), HU-07
  Registrar cliente (6 h) y HU-11 Registrar aseguradora (4 h) — 47 de 50 horas de capacidad.
- **Épicas:** EP-01 Acceso y seguridad (HU-01, HU-02, HU-03, HU-04, HU-06, HU-32), EP-07 (HT-04),
  EP-02 (HU-07) y EP-03 (HU-11).
- **Ramas:** `feat/sprint-03-acceso-sesiones` (Etapa A) y
  `feat/sprint-04-personal-clientes-aseguradoras` (Etapa B).
- **Fechas:** 21/09/2026 – 02/10/2026 (tabla 6-1 del backlog); verificación de las dos etapas
  ejecutada el 06/10/2026 sobre la rama de cada una.
- **Commits:** `ec5095f` Etapa A (integrada en `main` con `0ed5f38`, aprobada por el director del
  proyecto) y `2c62def` Etapa B (integrada con `b51e03e`).
- **Ejecución:** agente local (OpenCode) sobre una copia del repositorio.
- **Estado:** criterios de aceptación completados en las dos etapas. Pendiente: aceptación del
  Product Owner.

> Verificación ejecutada el **06/10/2026**; reproducible con los comandos de la sección 12.

## 1. Objetivo

Cerrar el acceso al sistema completo (Etapa A): inicio y cierre de sesión con **sesiones por familia
de rotación** en Redis y revocación inmediata (HU-01, HU-02), control de acceso por rol con la regla
de ADR-015 —ninguna ruta de negocio sin sesión y la verificación de recibos solo para el personal—
(HU-03), cambio de contraseña que cierra las demás sesiones (HU-06) y cierre por inactividad con
aviso previo, compartido entre pestañas (HU-32). Incluye la actualización de alcance del 06/10.

Sobre esa base, completar la SPA (HT-04) y la gestión del personal y de los datos de referencia
(Etapa B): usuarios del personal con contraseña temporal, cierre de sesiones y protección del último
administrador (HU-04); registro de clientes con RN-11, duplicados con mensaje claro y fecha de
creación (HU-07); y catálogo de aseguradoras con RUC validado, listado y edición (HU-11). La Etapa B
cierra los dos pendientes que dejó la A: cierre de sesiones al desactivar y desborde a 360 px.

## 2. Entregables

### Etapa A (HU-01, HU-02, HU-03, HU-06, HU-32)

| Entregable                                                               | Ubicación                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Constantes de sesión y esquemas (`contrasenaSchema`, cambio, recibo)     | `packages/shared/src/constants/sesion.ts`, `schemas/auth.schema.ts`, `schemas/recibo.schema.ts`                          |
| Puerto y adaptador de sesiones por familia (Lua atómico, fallo cerrado)  | `apps/api/src/modules/auth/application/ports/almacen-sesiones.port.ts`, `.../security/redis-almacen-sesiones.adapter.ts` |
| Emisor de tokens con familia (`sid`, `exp` absoluto)                     | `.../security/jwt-emisor.adapter.ts`                                                                                     |
| Casos de uso de login, refresco y cierre                                 | `.../application/use-cases/{login,refrescar-sesion,cerrar-sesion}.use-case.ts`                                           |
| Estrategia JWT con sesión viva y 502 si Redis no responde                | `.../security/jwt.estrategia.ts`, `shared-kernel/tiempo-limite.ts`                                                       |
| `Cache-Control: no-store` y 429 en español                               | `apps/api/src/common/middleware/sin-cache.middleware.ts`, `app.module.ts`                                                |
| Guard con denegación por defecto y descubrimiento de rutas               | `apps/api/src/common/auth/roles.guard.ts`, `apps/api/test/rutas-declaradas.ts`                                           |
| Verificación de recibos con sesión (`GET /recibos/:codigo/verificacion`) | `apps/api/src/modules/recibos/presentation/http/recibos.controller.ts`                                                   |
| `POST /auth/cambiar-contrasena` (argon2, cierra las demás sesiones)      | `apps/api/src/modules/auth/presentation/http/auth.controller.ts`, `.../use-cases/cambiar-contrasena.use-case.ts`         |
| Página `/cuenta/contrasena`, menú por rol y aviso de inactividad         | `apps/web/src/features/auth/`, `components/layout/AppLayout.tsx`, `app/router.tsx`                                       |
| Verificación con sesión y QR a ruta autenticada                          | `apps/web/src/features/verificacion/`, `features/recibos/components/TarjetaVerificacion.tsx`                             |
| e2e de autenticación y acceso por rol                                    | `apps/api/test/auth.e2e-spec.ts`, `apps/api/test/acceso-por-rol.e2e-spec.ts`                                             |
| Playwright: QR con sesión, "atrás" y reloj falso                         | `apps/web/e2e/flujo-completo.spec.ts`, `apps/web/e2e/sesion.spec.ts`                                                     |
| k6 autenticado                                                           | `infra/k6/verificacion-recibo.js`                                                                                        |
| ADR-015 enmendado y ADR-016                                              | `docs/adr/ADR-015-acceso-solo-autenticado.md`, `docs/adr/ADR-016-sesiones-redis.md`                                      |
| Documentación                                                            | `CLAUDE.md`, `AGENTS.md`, `apps/api/src/modules/README.md`, `README.md`, `docs/arquitectura/`                            |

### Etapa B (HT-04, HU-04, HU-07, HU-11)

| Entregable                                                                | Ubicación                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-11 (cédula, RUC y pasaporte) y normalización                           | `packages/shared/src/validacion/identificacion.ts`                                                                                                               |
| Esquemas de usuario, RN-11 en cliente y aseguradora, acciones nuevas      | `packages/shared/src/schemas/{usuario,cliente,aseguradora}.schema.ts`, `constants/auditoria.ts`                                                                  |
| Migración `usuario_nombre` con relleno de filas existentes                | `apps/api/prisma/migrations/20261006221954_usuario_nombre/`, `prisma/schema.prisma`, `prisma/seed.ts`                                                            |
| `cerrarTodas` en el almacén de sesiones y su exportación                  | `apps/api/src/modules/auth/application/ports/almacen-sesiones.port.ts`, `.../security/redis-almacen-sesiones.adapter.ts`, `auth.module.ts`                       |
| Casos de uso, puertos, generador y repositorio de usuarios                | `apps/api/src/modules/usuarios/application/`, `.../infrastructure/`, `.../presentation/http/usuarios.controller.ts`                                              |
| Endpoints de usuarios (alta, edición, desactivar, reactivar, restablecer) | `apps/api/src/modules/usuarios/presentation/http/usuarios.controller.ts`                                                                                         |
| Clientes: 409 por campo, RN-11 en el PATCH y retiro de `DELETE`           | `apps/api/src/modules/clientes/`                                                                                                                                 |
| Aseguradoras: `@Roles` por handler, 409 por RUC y retiro de `DELETE`      | `apps/api/src/modules/aseguradoras/`                                                                                                                             |
| Traducción de `P2002` a `ConflictoError`                                  | `apps/api/src/infrastructure/prisma/errores-prisma.ts`                                                                                                           |
| Páginas `/usuarios`, `/aseguradoras` y `/clientes` con sus formularios    | `apps/web/src/features/{usuarios,aseguradoras,clientes}/`, `apps/web/src/components/TablaDatos.tsx`                                                              |
| `alert-dialog` de shadcn/ui                                               | `apps/web/src/components/ui/alert-dialog.tsx`                                                                                                                    |
| Ruta y menú por rol, 360 px                                               | `apps/web/src/app/router.tsx`, `components/layout/AppLayout.tsx`, páginas existentes                                                                             |
| e2e del API y Playwright                                                  | `apps/api/test/{usuarios,clientes,aseguradoras}.e2e-spec.ts`, `apps/api/test/identificaciones.ts`, `apps/web/e2e/{personal,responsive,ayudas,identificacion}.ts` |
| Filtro de usuarios de la bitácora (`GET /bitacora/usuarios`)              | `apps/api/src/modules/auditoria/`, `apps/web/src/features/auditoria/`                                                                                            |
| ADR-017 y documentación                                                   | `docs/adr/ADR-017-validacion-identificaciones.md`, `CLAUDE.md`, `apps/api/src/modules/README.md`, `README.md`                                                    |

## 3. Criterios de aceptación y evidencia

### Etapa A — HU-01, HU-02, HU-03, HU-06 y HU-32

| #   | Criterio                                               | Evidencia                                                                                                                          |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | HU-01.1 token y cookie httpOnly                        | `auth.e2e-spec.ts` caso 1 (HttpOnly, SameSite=Strict, Path).                                                                       |
| 2   | HU-01.2 mensaje genérico                               | `auth.e2e-spec.ts` caso 2; `LoginPage.test.tsx`.                                                                                   |
| 3   | HU-01.3 sexto intento → 429 en español                 | `auth.e2e-spec.ts` caso 3.                                                                                                         |
| 4   | HU-01.4 renovación automática con vencimiento absoluto | `auth.e2e-spec.ts` casos 4, 5 y 7; `refrescar-sesion.use-case.spec.ts`; `api-client.test.ts` (Web Locks).                          |
| 5   | HU-01.5 contraseñas con argon2                         | `auth.e2e-spec.ts` casos 6 y 12; `seed.ts`.                                                                                        |
| 6   | HU-02.1 renovación invalidada en el servidor           | `auth.e2e-spec.ts` casos 8 y 9; `cerrar-sesion.use-case.spec.ts`.                                                                  |
| 7   | HU-02.2 cookie eliminada y redirección al login        | `auth.e2e-spec.ts` caso 8; `sesion.spec.ts` (Playwright).                                                                          |
| 8   | HU-02.3 "atrás" sin datos protegidos                   | `sesion.spec.ts`; `Cache-Control: no-store` en `auth.e2e-spec.ts` caso 8.                                                          |
| 9   | HU-03.1 roles en cada ruta y 403                       | `roles.guard.spec.ts`, `roles-cobertura.spec.ts` (lista exacta de públicas) y matriz de `acceso-por-rol.e2e-spec.ts`.              |
| 10  | HU-03.2 menú solo con las opciones del rol             | `AppLayout.test.tsx`; comprobación asistida de la DoD como CLIENTE.                                                                |
| 11  | HU-03.3 el CLIENTE solo obtiene lo suyo                | `acceso-por-rol.e2e-spec.ts` (dos clientes, pólizas y pagos aislados, 403 en recibos); `listar-pagos-de-cliente.use-case.spec.ts`. |
| 12  | HU-06.1 exige la contraseña actual                     | `cambiar-contrasena.use-case.spec.ts`; `auth.e2e-spec.ts` caso 10; `CambiarContrasenaPage.test.tsx`.                               |
| 13  | HU-06.2 al menos 8 caracteres                          | `esquemas-compartidos.spec.ts`; `auth.e2e-spec.ts` caso 11; `CambiarContrasenaPage.test.tsx`.                                      |
| 14  | HU-06.3 cierra las demás sesiones                      | `cambiar-contrasena.use-case.spec.ts`; `auth.e2e-spec.ts` caso 12 (la actual sigue, la otra no).                                   |
| 15  | HU-32.1 cierre a los 30 minutos                        | `AvisoInactividad.test.tsx`; `sesion.spec.ts`; servidor: `auth.e2e-spec.ts` casos 13 y 14 (TTL 31 min).                            |
| 16  | HU-32.2 aviso un minuto antes con "Continuar"          | `AvisoInactividad.test.tsx`; `sesion.spec.ts` ("Continuar mantiene la sesión").                                                    |
| 17  | HU-32.3 redirección al inicio de sesión                | `sesion.spec.ts` (aviso fijo en `/login`); `LoginPage.test.tsx`.                                                                   |
| 18  | ADR-015: regla de acceso y QR con sesión               | `roles-cobertura.spec.ts`; `flujo-anclaje.e2e-spec.ts`; `flujo-completo.spec.ts` paso 5; k6 `verificacion-recibo.js`.              |

### Etapa B — HT-04, HU-04, HU-07 y HU-11

| #   | Criterio                                        | Evidencia                                                                                                                   |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | HT-04.1 layout, usuario y sonner                | `AppLayout.test.tsx` (nombre en el encabezado y menú por rol); pruebas de las páginas con `toast` de sonner                 |
| 2   | HT-04.2 rutas por rol                           | `AppLayout.test.tsx`; `sesion.spec.ts`; `personal.spec.ts` (el OPERADOR no ve Usuarios y `/usuarios` lo devuelve al inicio) |
| 3   | HT-04.3 renovación ante 401                     | `api-client.test.ts` (refresh, Web Locks y motivo `expirada`)                                                               |
| 4   | HT-04.4 TanStack Query y RHF + Zod              | `Providers.tsx`; pruebas de `FormularioUsuario`, `FormularioAseguradora` y `FormularioCliente`                              |
| 5   | HT-04.5 desde 360 px                            | `responsive.spec.ts`: ADMIN, OPERADOR y CLIENTE sin `scrollWidth > 360`                                                     |
| 6   | HT-04.6 login de extremo a extremo              | `flujo-completo.spec.ts`; `personal.spec.ts`                                                                                |
| 7   | HU-04.1 alta con correo, nombre, rol y temporal | `crear-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 1; `UsuariosPage.test.tsx`; `personal.spec.ts`                |
| 8   | HU-04.2 correo único                            | `crear-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 2; `UsuariosPage.test.tsx`                                    |
| 9   | HU-04.3 desactivado sin acceso                  | `desactivar-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 4; `personal.spec.ts`                                    |
| 10  | HU-04.4 restablecer contraseña                  | `restablecer-contrasena.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 6                                                    |
| 11  | HU-07.1 RN-11                                   | `identificacion.spec.ts` (12 casos); `clientes.e2e-spec.ts` casos 1 y 2; `FormularioCliente.test.tsx`; ADR-017              |
| 12  | HU-07.2 duplicado con mensaje claro             | `clientes.use-cases.spec.ts`; `clientes.e2e-spec.ts` caso 3; `ClientesPage.test.tsx`; `personal.spec.ts`                    |
| 13  | HU-07.3 obligatorios con mensaje                | `esquemas-compartidos.spec.ts`; `clientes.e2e-spec.ts` caso 4; `FormularioCliente.test.tsx`                                 |
| 14  | HU-07.4 fecha de creación                       | `clientes.e2e-spec.ts` caso 1; `ClientesPage.test.tsx`                                                                      |
| 15  | HU-11.1 nombre y RUC de 13 dígitos              | `aseguradoras.e2e-spec.ts` casos 1 y 5; `identificacion.spec.ts`                                                            |
| 16  | HU-11.2 RUC duplicado                           | `aseguradoras.use-cases.spec.ts`; `aseguradoras.e2e-spec.ts` caso 2                                                         |
| 17  | HU-11.3 listar y editar                         | `aseguradoras.e2e-spec.ts` caso 3; `AseguradorasPage.test.tsx`                                                              |
| 18  | HU-11.4 sin cuenta ni acceso                    | `schema.prisma` (sin relación con `Usuario` ni rol propio); `aseguradoras.e2e-spec.ts` caso 4                               |
| 19  | Pendiente de la Etapa A: cierre al desactivar   | `redis-almacen-sesiones.adapter.spec.ts`; `usuarios.e2e-spec.ts` casos 4, 6 y 7                                             |

## 4. Definición de Terminado (§2.3 del backlog)

| Ítem                                                    | Etapa A                                                                                                                                            | Etapa B                                                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cumple todos sus criterios de aceptación                | ✅ Sección 3                                                                                                                                       | ✅ Sección 3                                                                                                                                                    |
| Pruebas automatizadas y CI en verde                     | ✅ local: 30 contratos + 106 API (23 suites) + 58 SPA (8 archivos) + 96 e2e del API (6 suites) + 4 de Playwright; lint, Prettier, tipos y build    | ✅ local: 30 contratos + 131 API (31 suites) + 97 SPA (14 archivos) + 134 e2e del API (9 suites) + 8 de Playwright; lint, Prettier, tipos, `deps:check` y build |
| Código integrado en la rama principal por pull request  | ✅ merge `0ed5f38`                                                                                                                                 | ✅ merge `b51e03e`                                                                                                                                              |
| Funciona en el entorno de desarrollo con Docker Compose | ✅ PostgreSQL 17 y Redis 7 de `compose.dev.yaml` (cliente `docker.exe`); nodo Hardhat nativo                                                       | ✅ los mismos contenedores; migrate + seed, e2e y Playwright                                                                                                    |
| Documentación afectada actualizada                      | ✅ ADR-015 enmendado, ADR-016, `AGENTS.md`, `CLAUDE.md`, `apps/api/src/modules/README.md`, `README.md`, `docs/arquitectura/`, `docs/despliegue.md` | ✅ ADR-017, `docs/adr/README.md`, `CLAUDE.md`, `apps/api/src/modules/README.md` y `README.md`                                                                   |
| El Product Owner la aceptó en la revisión del sprint    | ⏳ Pendiente                                                                                                                                       | ⏳ Pendiente                                                                                                                                                    |

## 5. Versiones exactas

La Etapa A no actualizó dependencias. La Etapa B agregó `@radix-ui/react-alert-dialog` (`^1.1.23`)
por el componente `alert-dialog` de shadcn/ui. Se mantienen Node.js 24 (CI)/26.7.0 (máquina de
verificación), pnpm 12.3.4, NestJS 11.2.6, Prisma 7.10.0, TypeScript 6.0.3, Zod 4.6.5, React 19.3 y
Playwright 1.63.

## 6. Decisiones y discrepancias

**Decisiones (ADR):** ADR-015 se enmienda (regla de acceso adelantada a S2; lista de rutas públicas
con logout y `/metrics`) y ADR-016 nuevo (sesiones por familia con inactividad) en la Etapa A;
ADR-017 fija las validaciones de RN-11 (cédula, RUC y pasaporte) y las ubica en `@oasis/shared`
para API y SPA en la Etapa B.

**Discrepancias entre los documentos y la realidad:**

1. El ERS `.docx` de `docs/` está desactualizado: RF-33 todavía dice "página pública" y RNF-12 cita
   la verificación pública con 30 consultas; tampoco tiene RF-36 en adelante. Manda el backlog.
2. `THROTTLE_VERIFICACION_PUBLICA_LIMIT` valía 20 y RNF-12 pide 30; se elimina en S2 y el límite
   por usuario llega en S5 (HU-28).
3. La tabla 6-1 de la arquitectura dice NestJS 12; se usa 11 (limitación conocida desde S1).
4. ADR-010 asume el modelo de datos completo, pero `TransaccionPagoLinea` (ADR-014) no está en el
   esquema, y así queda documentado.
5. La lista literal de rutas públicas de ADR-015 no incluía el logout (se autentica con la cookie de
   renovación) ni `/metrics` (infraestructura, ADR-009); se enmendó.
6. ADR-015 y `CLAUDE.md` situaban la migración de la verificación en un sprint posterior; la regla
   de acceso se adelantó a S2 y para el CLIENTE queda S5.
7. El `iat` de un JWT tiene resolución de segundo: el caso "renueva la sesión… obtiene otro access
   token" espera 1,1 s antes de refrescar para que el token sea distinto; misma sesión, mismo `sid`
   y mismo `exp`, que es lo que importa.
8. El texto de RN-11 no está en el repositorio (vive en el ERS `.docx`, sin versionar); se fijó por
   ADR-017 y queda pendiente confirmarlo contra el ERS.
9. El modelo de datos de ADR-010 no incluía `Usuario.nombre`; HU-04 lo exige y llega con la
   migración `usuario_nombre`, que rellena las filas existentes.
10. El criterio literal de HU-11 ("RUC de 13 dígitos") se amplió con la regla estructural de RN-11
    (provincia y tercer dígito), porque una aseguradora no puede llevar un RUC imposible.
11. Se retiraron `DELETE /clientes/:id` y `DELETE /aseguradoras/:id` por RN-09 ("desactivar no
    elimina", HU-08); la desactivación de clientes llega con HU-08 en S3.
12. Los formularios con `Select` de Radix necesitan `useController`: sin él, `shouldUnregister`
    excluía el tipo de identificación y el rol del envío. Se corrigió en la Etapa B.
13. Un opcional vacío (`telefono: ''`) hacía fallar la base del esquema y Zod no ejecutaba el
    `superRefine` del pipe, ocultando el resto de errores de un envío. Los opcionales vacíos se
    normalizan a `undefined` y cada campo muestra su propio mensaje.
14. `GET /usuarios` quedó limitado al personal (D35), así que el filtro de usuarios de la bitácora
    (HU-45) perdió a las cuentas CLIENTE; se agregó `GET /bitacora/usuarios` (ADMIN), que lista los
    usuarios con actividad y restaura el filtro completo.
15. D37 pedía que cambiar el rol fuera idempotente para reintentar tras un 502 de Redis. No hace
    falta: el rol ya quedó guardado y el refresco emite el nuevo, así que el viejo vive como mucho
    lo que dura el access token (15 min). Un `PATCH` con el mismo rol no cierra sesiones.

## 7. Impedimentos y observaciones

### Etapa A

- Las sesiones abiertas antes de S2 no traen `sid` y se rechazan: sus dueños deben iniciar sesión
  una vez tras el despliegue (queda anotado por si el cambio llega a producción con sesiones vivas).
- La prueba de Playwright del flujo completo destapó que `SoloInvitados` redirigía a `/` y pisaba la
  vuelta a la página pedida (D19): ahora vuelve a la ruta solicitada, con lo que el enlace del QR
  sin sesión termina en el resultado tras el login. Corregido en la etapa.
- `pnpm` es el binario de Windows aunque se invoque desde WSL: las variables exportadas en la shell
  solo llegan al proceso si se añaden a `WSLENV` (se usó con `LOG_LEVEL`).
- Docker Desktop no estaba iniciado en la máquina de verificación; la infraestructura se levantó con
  `docker.exe compose` tras arrancarlo.
- En Windows, el nodo de Hardhat se ejecutó nativo (`pnpm --filter @oasis/contracts exec hardhat
node`), como en S1; API y worker se lanzan desde `dist` para Playwright.
- Se limpió `bull:anclaje-recibos:*` antes de la corrida final de Playwright para no arrastrar
  trabajos de corridas anteriores.
- Tras recompilar `@oasis/shared` se borró `apps/web/node_modules/.vite` (prebundle de Vite).
- El hook `pre-commit` (lint-staged) no pudo ejecutarse con los 100 archivos de la etapa: la línea
  de comandos de Windows excede el límite al pasar 96 rutas a Prettier/ESLint. Se verificaron `lint`
  y `format:check` sobre el monorepo y el commit se creó con `--no-verify`; en un clon limpio o en
  CI (Linux) el hook no tiene ese límite.
- El límite de login cuenta por IP, como pide HU-01 ("desde la misma IP"). Si el personal sale a
  internet por una sola IP pública (NAT de la oficina), los 5 intentos por minuto se comparten entre
  todos. Se consulta al Product Owner si conviene contar por IP y correo; cambiarlo exige enmendar
  el criterio del backlog.
- Correcciones tras la revisión de la etapa, con su prueba:
  - El almacén de sesiones registra la causa del fallo de Redis antes de responder 502.
  - El cambio de contraseña cierra las demás sesiones antes de guardar el hash: si Redis falla, la
    contraseña no cambia y no queda nada a medias.
  - `no-store` pasó de interceptor a middleware para cubrir también los 401, 403 y 429 de los
    guards (`auth.e2e-spec.ts` caso 8).
  - `apiFetch` relee el token del store tras un refresco fallido: un 401 atrasado ya no cierra una
    sesión abierta mientras tanto.
  - "Cerrar sesión" en el aviso de inactividad detiene el reloj, y el intervalo ya no se recrea en
    cada render.
  - Se quitó el BOM de diez archivos del API heredados de S1.

### Etapa B

- En bases ya sembradas, la migración rellena `Usuario.nombre` con la parte local del correo
  (`admin`), no con el nombre que el seed crea para bases nuevas ("Administrador Oasis"). El seed
  no pisa filas existentes (`update: {}`).
- La limpieza manual de la cola de BullMQ con el worker en caliente dejó un recibo ENVIADO huérfano
  que bloqueó la cola hasta 120 s por intento (`TIMEOUT_RECEIPT_MS`); se cerró como FALLIDO y el
  worker se reinició. Para Playwright, la limpieza de `bull:anclaje-recibos:*` debe hacerse con el
  worker detenido.
- Tras recompilar `@oasis/shared` se borró `apps/web/node_modules/.vite` (prebundle de Vite).
- `pnpm` es el binario de Windows aunque se invoque desde WSL; API, worker y nodo Hardhat se
  lanzaron nativos desde Windows para Playwright.
- El hook `pre-commit` (lint-staged) puede fallar en Windows con muchos archivos; si ocurre, se
  verifican `lint` y `format:check` del monorepo y se commitea con `--no-verify`, anotándolo.
- Correcciones tras la revisión de la etapa, con su prueba:
  - `GET /bitacora/usuarios` consulta los usuarios con `EXISTS` sobre la bitácora; el `distinct` de
    Prisma recorría en memoria toda la tabla, que crece con cada inicio de sesión.
  - Un `PATCH /usuarios/:id` con el mismo rol ya no cierra las sesiones del usuario
    (`editar-usuario.use-case.spec.ts`).
  - RN-11 vive en una sola función (`validarIdentificacion`); `validarCedula`, `validarRuc` y
    `validarPasaporte` la envuelven.
  - La identificación del cliente se recorta antes de medir su longitud: un pasaporte de 20
    caracteres con espacios alrededor ya no se rechaza (`esquemas-compartidos.spec.ts`).
  - Los `Select` de rol y de tipo de identificación anuncian su error y su ayuda con
    `aria-describedby`.
  - Pruebas de la traducción de `P2002` en `errores-prisma.spec.ts` y en los repositorios de
    usuarios, clientes y aseguradoras.
- El job `auditoria-cobertura` mantiene su mapa manual de mutaciones esperadas: se agregaron las
  cinco de usuarios y se retiraron los `DELETE` de clientes y aseguradoras.

## 8. Horas de backlog

| Etapa | Historia  |  Horas |
| ----- | --------- | -----: |
| A     | HU-01     |      8 |
| A     | HU-02     |      3 |
| A     | HU-03     |      6 |
| A     | HU-06     |      3 |
| A     | HU-32     |      2 |
| B     | HT-04     |     10 |
| B     | HU-04     |      5 |
| B     | HU-07     |      6 |
| B     | HU-11     |      4 |
|       | **Total** | **47** |

Son las horas del backlog sobre 50 de capacidad; el informe no reporta horas reales.

## 9. Deuda y fuera de alcance

| Deuda                                                                                                                            | Sprint destino    |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Verificación del CLIENTE sobre sus recibos (RN-07), 30 consultas por minuto por usuario y resultados                             | S5 (HU-28)        |
| Cambio obligatorio de la contraseña temporal en el primer ingreso, para el personal y los clientes                               | S6 (HU-05)        |
| Recuperación de contraseña (ya figura en la lista de rutas públicas de ADR-015)                                                  | S7 (HU-31)        |
| Firefox y WebKit en Playwright                                                                                                   | S8 (HT-09)        |
| Editar y desactivar clientes; búsqueda y paginación de 20 en 20                                                                  | S3 (HU-08, HU-09) |
| Errores de Zod en dos tandas cuando un opcional distinto de `telefono` llega vacío y falla                                       | S5                |
| Carrera entre dos ADMIN que se desactivan a la vez (`ponytail:` en `actualizarSiNoEsUltimoAdmin`; salida, `SELECT … FOR UPDATE`) | —                 |
| Carrera entre un inicio de sesión y una desactivación simultáneos (la sesión vive hasta su refresco)                             | —                 |
| El relleno de `Usuario.nombre` no trata `razonSocial = ''` (el esquema lo impide desde S1)                                       | —                 |
| `@tanstack/react-table` instalado sin uso desde HT-04                                                                            | S3 (se retiró)    |

## 10. Acciones del autor

- [x] Agregar ADR-016 y ADR-017 a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md` (versión 1.4,
      23/10/2026).
- [ ] Confirmar el texto de RN-11 contra el ERS y, si resulta más estricto, ajustar ADR-017 y
      `validacion/identificacion.ts`.

## 11. Pruebas manuales

Ejecutadas de forma asistida (specs de Playwright):

- Sin sesión, el enlace del QR lleva al login y, tras ingresar, muestra el resultado ✅ (también en
  `flujo-completo.spec.ts`).
- Como CLIENTE el menú solo muestra Inicio y `/recibos/verificar` redirige al inicio ✅.
- La página de contraseña y la verificación no desbordan a 360 px; el tabulador recorre los tres
  campos de contraseña ✅.
- El ADMIN crea un operador, copia la contraseña con el botón (se verificó el portapapeles) y el
  operador entra con ella en otro contexto; al desactivarlo, su siguiente acción lo devuelve al
  login (`personal.spec.ts`) ✅.
- El menú del OPERADOR muestra Aseguradoras sin "Nueva" y no muestra Usuarios; `/usuarios` lo
  redirige al inicio (`personal.spec.ts`) ✅.
- Las tres páginas de la Etapa B y el resto de rutas no desbordan a 360 px, por rol
  (`responsive.spec.ts`) ✅.

Pendientes de una persona:

- Mismo usuario en un navegador normal y una ventana privada: cerrar sesión en una no afecta a la
  otra; cambiar la contraseña en una saca a la otra en su siguiente acción y la que cambió sigue
  dentro (el servidor ya lo garantiza en `auth.e2e-spec.ts` casos 9 y 12; falta la comprobación en
  navegador).
- Lector de pantalla sobre el aviso de inactividad (anuncio al abrir y foco en "Continuar"), la
  página de contraseña, el diálogo de la contraseña temporal (anuncio y foco en "Copiar") y los
  errores por campo de los tres formularios.
- Pasada con teclado por las tablas, los menús de acciones y los diálogos.

## 12. Cómo verificar

```bash
# Calidad (sin infraestructura)
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                       # 30 contratos + 131 API + 97 SPA

# Infraestructura (PostgreSQL y Redis con compose; nodo Hardhat aparte)
docker compose -f compose.dev.yaml up -d postgres redis
pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1 &
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # aplica usuario_nombre
pnpm --filter @oasis/api seed
pnpm test:e2e                   # 9 suites, 134 pruebas
pnpm --filter @oasis/web test:e2e   # Playwright: 8 pruebas
```
