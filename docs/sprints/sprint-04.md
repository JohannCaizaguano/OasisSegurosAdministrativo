# Sprint 4 — Base de la SPA, usuarios del personal, clientes y aseguradoras

- **Historias:** HT-04 Base del frontend con shadcn/ui (10 h), HU-04 Gestionar usuarios del
  personal (5 h), HU-07 Registrar cliente (6 h) y HU-11 Registrar aseguradora (4 h) — 25 de 25
  horas de capacidad.
- **Épicas:** EP-07 (HT-04), EP-01 (HU-04), EP-02 (HU-07) y EP-03 (HU-11).
- **Rama:** `feat/sprint-04-personal-clientes-aseguradoras` (sin publicar).
- **Fechas:** 28/09/2026 – 02/10/2026 (tabla 6-1 del backlog); verificación ejecutada el
  06/10/2026 sobre la rama del sprint.
- **Estado:** criterios de aceptación completados; pendientes de la DoD que dependen de terceros
  (PR, CI en GitHub y aceptación del Product Owner).

> Verificación ejecutada el **06/10/2026** sobre la rama del sprint; reproducible con los comandos
> de la sección 11.

## 1. Objetivo

Completar la base de la SPA (HT-04) y cerrar la gestión del personal y los datos de referencia:
usuarios del personal con contraseña temporal, cierre de sesiones y protección del último
administrador (HU-04); registro de clientes con RN-11, duplicados con mensaje claro y fecha de
creación (HU-07); y catálogo de aseguradoras con RUC validado, listado y edición (HU-11). Incluye
las dos deudas de S3 asignadas al sprint: cierre de sesiones al desactivar y desborde a 360 px.

## 2. Entregables

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
| ADR-017 y documentación                                                   | `docs/adr/ADR-017-validacion-identificaciones.md`, `CLAUDE.md`, `apps/api/src/modules/README.md`, `README.md`, este informe                                      |

## 3. Criterios de aceptación — HT-04, HU-04, HU-07 y HU-11

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
| 19  | Deuda S3: cierre de sesiones al desactivar      | `redis-almacen-sesiones.adapter.spec.ts`; `usuarios.e2e-spec.ts` casos 4, 6 y 7                                             |

## 4. Definición de Terminado (§2.3 del backlog)

| Ítem                                                        | Estado   | Nota                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cumple todos sus criterios de aceptación                    | ✅       | Sección 3.                                                                                                                                                                                                                                                      |
| Pruebas automatizadas y CI en verde                         | ✅ local | 30 contratos + 131 API (31 suites) + 97 SPA (14 archivos) + 134 e2e del API (9 suites) + 8 de Playwright; `lint`, Prettier, `typecheck`, `deps:check` y `deps:check:negativo` y build en verde. El CI se ejecuta al abrir el PR: no se publica desde el agente. |
| Código integrado en la rama principal mediante pull request | ⏳       | El usuario hace push y abre el PR.                                                                                                                                                                                                                              |
| Funciona en el entorno de desarrollo con Docker Compose     | ✅       | PostgreSQL 17 y Redis 7 con `compose.dev.yaml` (cliente `docker.exe`); nodo Hardhat nativo; migrate + seed, e2e y Playwright contra esos contenedores.                                                                                                          |
| Documentación afectada actualizada                          | ✅       | ADR-017, `docs/adr/README.md`, `CLAUDE.md`, `apps/api/src/modules/README.md`, `README.md` y este informe.                                                                                                                                                       |
| El Product Owner la aceptó en la revisión del sprint        | ⏳       | Pendiente de la revisión semanal.                                                                                                                                                                                                                               |

## 5. Versiones exactas

Se agregó `@radix-ui/react-alert-dialog` (`^1.1.23`) por el componente `alert-dialog` de shadcn/ui.
No se actualizó ninguna otra dependencia. Se mantienen Node.js 24 (CI), pnpm 12.3.4, NestJS 11.2.6,
Prisma 7.10.0, TypeScript 6.0.3, Zod 4.6.5, React 19.3 y Playwright 1.63.

## 6. Decisiones y discrepancias

**Decisiones (ADR):** ADR-017 fija las validaciones de RN-11 (cédula, RUC y pasaporte) y las ubica
en `@oasis/shared` para API y SPA. El informe pide al autor agregarlo a la tabla 11-1.

**Discrepancias entre los documentos y la realidad:**

1. El texto de RN-11 no está en el repositorio (vive en el ERS `.docx`, sin versionar); se fijó por
   ADR-017 y queda pendiente confirmarlo contra el ERS.
2. El modelo de datos de ADR-010 no incluía `Usuario.nombre`; HU-04 lo exige y llega con la
   migración `usuario_nombre`, que rellena las filas existentes.
3. El criterio literal de HU-11 ("RUC de 13 dígitos") se amplió con la regla estructural de RN-11
   (provincia y tercer dígito), porque una aseguradora no puede llevar un RUC imposible.
4. Se retiraron `DELETE /clientes/:id` y `DELETE /aseguradoras/:id` por RN-09 ("desactivar no
   elimina", HU-08); la desactivación de clientes llega con HU-08 en S5.
5. La tabla 6-1 de la arquitectura dice NestJS 12 y se usa 11 (limitación conocida desde S1).
6. Los formularios con `Select` de Radix necesitan `useController`: sin él, `shouldUnregister`
   excluía el tipo de identificación y el rol del envío. Se corrigió en S4.
7. Un opcional vacío (`telefono: ''`) hacía fallar la base del esquema y Zod no ejecutaba el
   `superRefine` del pipe, ocultando el resto de errores de un envío. Los opcionales vacíos se
   normalizan a `undefined` y cada campo muestra su propio mensaje.
8. `GET /usuarios` quedó limitado al personal (D6), así que el filtro de usuarios de la bitácora
   (HU-45) perdió a las cuentas CLIENTE; se agregó `GET /bitacora/usuarios` (ADMIN), que lista los
   usuarios con actividad y restaura el filtro completo.
9. D8 pedía que cambiar el rol fuera idempotente para reintentar tras un 502 de Redis. No hace
   falta: el rol ya quedó guardado y el refresco emite el nuevo, así que el viejo vive como mucho
   lo que dura el access token (15 min). Un `PATCH` con el mismo rol no cierra sesiones.

## 7. Impedimentos y observaciones

- En bases ya sembradas, la migración rellena `Usuario.nombre` con la parte local del correo
  (`admin`), no con el nombre que el seed crea para bases nuevas ("Administrador Oasis"). El seed
  no pisa filas existentes (`update: {}`), como en S3.
- La limpieza manual de la cola de BullMQ con el worker en caliente dejó un recibo ENVIADO huérfano
  que bloqueó la cola hasta 120 s por intento (`TIMEOUT_RECEIPT_MS`); se cerró como FALLIDO y el
  worker se reinició. Para Playwright, la limpieza de `bull:anclaje-recibos:*` debe hacerse con el
  worker detenido.
- Tras recompilar `@oasis/shared` se borró `apps/web/node_modules/.vite` (prebundle de Vite).
- `pnpm` es el binario de Windows aunque se invoque desde WSL; API, worker y nodo Hardhat se
  lanzaron nativos desde Windows para Playwright.
- El hook `pre-commit` (lint-staged) puede fallar en Windows con muchos archivos; si ocurre, se
  verifican `lint` y `format:check` del monorepo y se commitea con `--no-verify`, anotándolo.
- Correcciones tras la revisión del sprint, con su prueba:
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

## 8. Deuda y trabajo fuera de alcance (para sprints siguientes)

- Cambio obligatorio de la contraseña temporal en el primer ingreso, para el personal y los
  clientes (HU-05, S10).
- Editar y desactivar clientes (HU-08) y búsqueda/paginación de 20 en 20 (HU-09), S5.
- Verificación de recibos por el CLIENTE con límite por usuario (HU-28, S8).
- Recuperación de contraseña (HU-31, S13).
- Firefox y WebKit en Playwright (HT-09, S15).
- La carrera entre dos ADMIN que se desactivan a la vez (`ponytail:` en
  `PrismaUsuariosRepository.actualizarSiNoEsUltimoAdmin`): techo aceptable con pocos
  administradores; salida, `SELECT … FOR UPDATE`.
- Si un campo opcional distinto de `telefono` llega vacío y falla, Zod omite los `superRefine` del
  esquema y el envío muestra los errores en dos tandas.
- Carrera entre un inicio de sesión y una desactivación simultáneos: la sesión abierta en ese
  instante sobrevive hasta que el usuario vuelva a refrescar (el refresco relee `activo`).
- El relleno de `Usuario.nombre` no trata `razonSocial = ''` (el esquema lo impide desde S1).
- `@tanstack/react-table` sigue instalado sin uso (venía de HT-04); se retira cuando una tabla lo
  necesite o en una limpieza de dependencias.

## 9. Acciones del autor

- Agregar **ADR-017** a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md` (el agente no edita
  `docs/referencia/`).
- Confirmar el texto de RN-11 contra el ERS y, si resulta más estricto, ajustar ADR-017 y
  `validacion/identificacion.ts`.

## 10. Pruebas manuales

Ejecutadas de forma asistida (specs de Playwright):

- El ADMIN crea un operador, copia la contraseña con el botón (se verificó el portapapeles) y el
  operador entra con ella en otro contexto; al desactivarlo, su siguiente acción lo devuelve al
  login (`personal.spec.ts`).
- El menú del OPERADOR muestra Aseguradoras sin "Nueva" y no muestra Usuarios; `/usuarios` lo
  redirige al inicio (`personal.spec.ts`).
- Las tres páginas y el resto de rutas no desbordan a 360 px, por rol (`responsive.spec.ts`).

Pendientes de una persona:

- Lector de pantalla sobre el diálogo de la contraseña temporal (anuncio y foco en "Copiar") y
  sobre los errores por campo de los tres formularios.
- Pasada con teclado por las tablas, los menús de acciones y los diálogos.

## 11. Cómo verificar

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
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed
pnpm test:e2e                   # 9 suites, 134 pruebas
pnpm --filter @oasis/web test:e2e   # Playwright: 8 pruebas
```
