# Sprint 4 — Plan de implementación

- **Historias:** HT-04 Base del frontend con shadcn/ui (10 h), HU-04 Gestionar usuarios del
  personal (5 h), HU-07 Registrar cliente (6 h) y HU-11 Registrar aseguradora (4 h): 25 de 25 horas
  de capacidad.
- **Fechas:** 28/09/2026 – 02/10/2026 (tabla 6-1 del backlog).
- **Rama:** `feat/sprint-04-personal-clientes-aseguradoras`.
- **Ejecuta:** agente local (OpenCode) sobre esta copia del repositorio.
- **Decisiones acordadas con el desarrollador:** 06/10/2026 (sección 2).

Este documento es el Sprint Backlog del Sprint 4. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.
OpenCode solo carga `AGENTS.md`: lee los otros dos antes de empezar. La fuente de verdad está en
`docs/referencia/`, que no se edita. Si algo de este plan contradice `docs/referencia/`, gana la
referencia: detente y repórtalo.

**Cómo leer las tareas.** Cada tarea trae un **miniprompt** (qué hacer, archivos, comportamiento,
casos borde, restricciones, pruebas primero, skills y verificación) y, cuando ayuda, un bloque
**Ejemplo (orientativo)**. El ejemplo muestra la forma o la parte delicada; no se copia tal cual:
adáptalo al código real con tu criterio y con las skills de la fase.

## 0. Reglas de ejecución

1. Ejecuta las fases en orden: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7.
2. TDD en toda lógica nueva: primero la prueba en rojo y luego el código (`test-driven-development`).
   Antes de cerrar una fase usa `verification-before-completion` y guarda la salida para el informe.
3. Al empezar cada fase, invoca las skills de su fila en la tabla de la sección 0.1, en el orden de
   `AGENTS.md`: skill de proceso → skill de la tecnología → ponytail decide el tamaño.
4. Tras cambiar `packages/shared/src`, ejecuta `pnpm --filter @oasis/shared build` para que el API y
   la SPA vean el cambio, y borra `apps/web/node_modules/.vite`: Vite no invalida el prebundle de un
   paquete del workspace cuando cambia su `dist` (informe de S2, §9).
5. Nunca edites `docs/referencia/`.
6. **Un solo commit** al final (sección 13), sin líneas de atribución (`Co-Authored-By`, "Generated
   with…"). Antes, comprueba que `git config user.name` sea `JohannCaizaguano`. **No hagas push ni
   abras el PR**: los hace el usuario.
7. No adelantes trabajo de otros sprints; lo que quede fuera de alcance se anota como deuda en el
   informe (sección 12.2).
8. Comentarios solo para el porqué no obvio y en español (`AGENTS.md`). Las simplificaciones
   deliberadas llevan un comentario `ponytail:` con el techo y la salida.

### 0.1 Skills por fase

| Momento                               | Skills                                                                                                                                           | Para qué                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Todo el sprint                        | `executing-plans`, `ponytail`                                                                                                                    | Seguir el plan fase por fase con el diff más corto que funcione.         |
| Toda lógica nueva                     | `test-driven-development`                                                                                                                        | Prueba en rojo antes del código.                                         |
| Un fallo o una prueba roja inesperada | `systematic-debugging`                                                                                                                           | Causa raíz antes de cambiar código.                                      |
| Cierre de cada fase                   | `verification-before-completion`                                                                                                                 | Evidencia (salida de los comandos) antes de declarar la fase terminada.  |
| Fase 1 (T1 y T2)                      | `zod`, `typescript-advanced-types`, `vitest`                                                                                                     | Validadores de RN-11, `superRefine`, esquemas de usuario y sus pruebas.  |
| Fase 2 (T3)                           | `prisma-cli`, `prisma-client-api`                                                                                                                | Migración con relleno de `nombre` y seed.                                |
| Fase 2 (T4 a T6)                      | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`, `prisma-client-api`                                                 | Puerto de sesiones, casos de uso, módulos, controlador y `P2002`.        |
| Fase 3 (T7 y T8)                      | `nestjs-best-practices`, `prisma-client-api`, `zod`                                                                                              | RN-11 en el API, retiro de `DELETE` y permisos de aseguradoras.          |
| Fase 4 (T9 y T10)                     | `react-best-practices`, `composition-patterns`, `shadcn`, `tailwind-v4-shadcn`, `tailwind-css-patterns`, `impeccable`, `accessibility`, `vitest` | Auditoría de HT-04, 360 px, tabla paginada compartida y `alert-dialog`.  |
| Fase 5 (T11 a T13)                    | `react-hook-form`, `zod`, `react-best-practices`, `shadcn`, `tailwind-css-patterns`, `impeccable`, `frontend-design`, `accessibility`, `vitest`  | Páginas de usuarios, aseguradoras y clientes, formularios y sus pruebas. |
| Fase 6, API (T14)                     | `nestjs-best-practices`, `prisma-client-api`                                                                                                     | e2e con Supertest y datos de prueba.                                     |
| Fase 6, SPA (T15)                     | `playwright-best-practices`                                                                                                                      | Flujo del personal entre dos contextos y la prueba de 360 px.            |
| Fase 7 (cierre)                       | `ponytail-review`, `verification-before-completion`                                                                                              | Revisar el diff completo y ejecutar la Definición de Terminado.          |
| Si Vite sirve un prebundle viejo      | `vite`                                                                                                                                           | Caché de `optimizeDeps` tras recompilar `@oasis/shared`.                 |

No aplican: `brainstorming` y `writing-plans` (el diseño y el plan ya están acordados),
`bash-defensive-patterns` (no hay scripts bash nuevos), `prisma-postgres`, `prisma-database-setup` y
`seo`. La documentación (T16) sigue las reglas de `AGENTS.md` sin skill propia.

**`impeccable` en este sprint:**

- Es refinamiento de una SPA existente: conserva la identidad visual (componentes shadcn y tokens de
  `index.css`). Las páginas nuevas copian el patrón de `ClientesPage`; no rediseñes las demás, solo
  corrige su desborde a 360 px.
- Ejecuta `.agents/skills/impeccable/scripts/impeccable context --target <archivo>` una vez por
  sesión. No existen `PRODUCT.md` ni `DESIGN.md`: no ejecutes `init` ni `document`, porque crearían
  documentos que nadie pidió (`AGENTS.md`).
- Usa `harden` en los tres formularios (usuario, aseguradora y cliente: errores por campo, 409 y
  estados de envío) y en el diálogo de la contraseña temporal; `audit` y `polish` sobre
  `UsuariosPage`, `AseguradorasPage` y `ClientesPage` (accesibilidad, teclado y 360 px).
- Haz una ronda de revisión y como máximo una de confirmación.

**Superpowers en este sprint:**

- `executing-plans` pide un espacio aislado, pero **no crees un worktree**: trabaja en la rama de T0
  sobre esta copia.
- Su ledger vive en `.superpowers/sdd/sprint-04-plan/`, que ya está en `.gitignore`.
- Sin commits por tarea: el único commit es el de la sección 13.
- Las decisiones de la sección 2 no se reabren con un "ruling". Si una deja de ser viable, detente y
  pregunta; los demás desvíos menores van al ledger y al informe como discrepancias.
- Al terminar, si `finishing-a-development-branch` ofrece opciones, elige "conservar la rama tal
  cual": sin merge, push ni PR.

## 1. Alcance

### HT-04 — Base del frontend con shadcn/ui (RNF-20)

- El layout incluye barra lateral, encabezado con usuario y notificaciones con sonner.
- Las rutas se protegen según el rol.
- El cliente de API renueva el token automáticamente ante un 401.
- TanStack Query y React Hook Form con Zod quedan configurados.
- La interfaz se adapta desde 360 px de ancho.
- La pantalla de inicio de sesión funciona de extremo a extremo.

### HU-04 — Gestionar usuarios del personal (RF-05)

- Se crea un usuario con correo, nombre, rol ADMIN u OPERADOR y contraseña temporal.
- El correo es único en el sistema.
- Un usuario desactivado no puede iniciar sesión.
- El administrador puede restablecer la contraseña de un usuario.

### HU-07 — Registrar cliente (RF-08)

- El tipo de identificación (cédula, RUC o pasaporte) se valida según RN-11.
- Una identificación duplicada se rechaza con un mensaje claro.
- Los campos obligatorios muestran mensajes de validación.
- Se registra la fecha de creación del cliente.

### HU-11 — Registrar aseguradora (RF-12)

- Se registra nombre y RUC de 13 dígitos.
- Un RUC duplicado se rechaza.
- Las aseguradoras se pueden listar y editar.
- Las aseguradoras son datos de referencia de las pólizas; no tienen cuenta ni acceso al sistema.

### Deuda de S3 que entra en este sprint

- Cierre de las sesiones al desactivar un usuario (HU-04).
- Desborde a 360 px de `/`, `/pagos` y `/recibos` (HT-04).

### Fuera de alcance (no implementar)

- Editar y desactivar clientes (HU-08, S5): el `PATCH /clientes/:id` existente se queda como está,
  sin la regla "identificación fija si tiene pólizas" ni la desactivación.
- Búsqueda, filtro de activos y paginación de 20 en 20 de clientes (HU-09, S5): la búsqueda `q`
  existente se queda como está.
- Cuentas de CLIENTE y cambio obligatorio de la contraseña temporal en el primer ingreso (HU-05,
  S10), también para el personal.
- Recuperación de contraseña (HU-31, S13).
- Verificación del CLIENTE y límite por usuario (HU-28, S8).
- Firefox y WebKit en Playwright (HT-09, S15).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Motivo                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Plan con el formato de S3, ejecutado por OpenCode; un solo commit sin atribuciones; push y PR los hace el usuario. Fechas del backlog (28/09–02/10).                                                                                                                                                                                                                                                                                                                                                                                                     | `AGENTS.md` y preferencia del desarrollador.                                                                                                           |
| D2  | Alcance: HT-04, HU-04, HU-07 y HU-11, más las dos deudas de S3 asignadas a S4. El código existente de edición y búsqueda de clientes no se toca salvo para RN-11.                                                                                                                                                                                                                                                                                                                                                                                        | Regla de alcance.                                                                                                                                      |
| D3  | `Usuario.nombre String` obligatorio, con una migración que rellena las filas existentes: personal → parte local del correo; CLIENTE → `razonSocial` o `nombres apellidos` del cliente vinculado. Auth lee la columna y se elimina `nombreVisible` de `PrismaUsuarioAuthRepository`. El seed crea "Administrador Oasis", "Operador Oasis" y, para el cliente, su nombre; `update: {}` no cambia.                                                                                                                                                          | HU-04 pide nombre y el modelo no lo tiene. El relleno cubre las bases ya sembradas.                                                                    |
| D4  | La contraseña temporal la **genera el sistema** con `node:crypto`, cumple `contrasenaSchema` y se muestra **una sola vez** en un diálogo con botón de copiar. Nunca se guarda en claro, ni en logs, ni en la bitácora. Puerto `GENERADOR_CONTRASENA` con un comentario `ponytail:` (una implementación; existe para inyectar un valor conocido en pruebas).                                                                                                                                                                                              | El ADMIN no inventa ni reutiliza contraseñas.                                                                                                          |
| D5  | El cambio obligatorio de la temporal en el primer ingreso queda para HU-05 (S10), que lo extiende al personal. Se anota como deuda.                                                                                                                                                                                                                                                                                                                                                                                                                      | Regla de alcance.                                                                                                                                      |
| D6  | Endpoints de `usuarios`, todos `@Roles('ADMIN')`: `GET /usuarios` (lista solo cuentas ADMIN y OPERADOR, 20 por página, sin búsqueda); `POST /usuarios` → `{ usuario, contrasenaTemporal }`; `PATCH /usuarios/:id` con `{ nombre?, rol? }`; `POST /usuarios/:id/desactivar`, `/reactivar` y `/restablecer-contrasena` (este último → `{ contrasenaTemporal }`). Ninguna respuesta incluye `passwordHash`.                                                                                                                                                 | Un endpoint por acción auditada.                                                                                                                       |
| D7  | El correo no se edita (identidad de acceso y de la bitácora). El rol solo puede ser ADMIN u OPERADOR: crear o editar con CLIENTE → 400 por el esquema. Las cuentas CLIENTE no se listan ni se gestionan aquí (HU-05, S10); actuar sobre una por id → 404.                                                                                                                                                                                                                                                                                                | HU-04 es "del personal".                                                                                                                               |
| D8  | Desactivar, cambiar el rol y restablecer la contraseña **cierran todas las sesiones** del usuario con `cerrarTodas(usuarioId)` (nuevo en `AlmacenSesionesPort`, `SCAN` de `sesion:<id>:*` + `DEL`). Orden: primero la base (impide nuevos inicios con el estado viejo) y luego Redis. Si Redis falla → 502 (`ErrorDependenciaExterna`); desactivar y cambiar el rol son idempotentes, así que reintentar cierra las sesiones.                                                                                                                            | Deuda de S3; el JWT lleva el rol y `JwtEstrategia` solo consulta Redis.                                                                                |
| D9  | Se puede reactivar. Protecciones (`ReglaNegocioError`, 422): el ADMIN no puede desactivarse, cambiarse el rol ni restablecerse la contraseña a sí mismo (usa `/cuenta/contrasena`); no se puede desactivar ni degradar al **último ADMIN activo**. El conteo y la escritura van en una `$transaction`; la carrera entre dos ADMIN simultáneos se acepta con un comentario `ponytail:`.                                                                                                                                                                   | Evita dejar el sistema sin administrador.                                                                                                              |
| D10 | Formato de error sin cambios (`statusCode, code, message, details, …`). Duplicados → `ConflictoError` (409) con `details: { campo, motivo }`, donde `motivo` es `CORREO_DUPLICADO`, `IDENTIFICACION_DUPLICADA` o `RUC_DUPLICADO`. Reglas de D9 → `ReglaNegocioError` con `details: { motivo: 'ULTIMO_ADMIN' \| 'AUTO_MODIFICACION' }`. Además de la comprobación previa, el repositorio traduce el `P2002` de Prisma al mismo 409.                                                                                                                       | La SPA pone el 409 en su campo; `AllExceptionsFilter` ya pasa `detalles` a `details`.                                                                  |
| D11 | **RN-11** en `@oasis/shared` (`validarIdentificacion` y `validarRuc`), usadas por `crearClienteSchema` y `actualizarClienteSchema` con `superRefine` y por los esquemas de aseguradora. Cédula: 10 dígitos, provincia 01–24 o 30, tercer dígito < 6 y verificador módulo 10. RUC: 13 dígitos, termina en `001`, provincia válida; tercer dígito 0–5 → los 10 primeros son una cédula válida; 6 o 9 → solo estructura, **sin módulo 11**. Pasaporte: 5–20 alfanuméricos, se normaliza a mayúsculas. Cédula y RUC: se quitan los espacios de los extremos. | El texto de RN-11 no está en el repo (ERS `.docx` sin versionar). El SRI emite RUC de sociedades que no cumplen el módulo 11 (comentario `ponytail:`). |
| D12 | ADR-017 "Validación de identificaciones ecuatorianas (RN-11)". El informe pide al autor agregarlo a la tabla 11-1.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Fija una regla de negocio que el backlog cita y el repo no define.                                                                                     |
| D13 | Se retiran `DELETE /clientes/:id` y `DELETE /aseguradoras/:id` con sus casos de uso, métodos de repositorio y referencias en pruebas. `ELIMINAR` sigue en `ACCIONES_AUDITORIA` (filas antiguas de la bitácora).                                                                                                                                                                                                                                                                                                                                          | RN-09 ("desactivar no elimina", HU-08); HU-11 solo pide listar y editar.                                                                               |
| D14 | Aseguradoras: `POST` y `PATCH` solo ADMIN; `GET` (lista y por id) ADMIN y OPERADOR, porque el operador las elige al registrar pólizas en S5. Clientes siguen ADMIN y OPERADOR.                                                                                                                                                                                                                                                                                                                                                                           | HU-11 dice "como administrador".                                                                                                                       |
| D15 | Acciones nuevas en `ACCIONES_AUDITORIA`: `DESACTIVAR`, `REACTIVAR` y `RESTABLECER_CONTRASENA`, con su etiqueta en `BitacoraPage`. Crear usuario → `CREAR`; editar → `MODIFICAR`.                                                                                                                                                                                                                                                                                                                                                                         | La bitácora (HU-45) filtra por acción.                                                                                                                 |
| D16 | HT-04 en S4: (1) auditar cada criterio con evidencia, existente o nueva; (2) corregir los 360 px en todas las pantallas, nuevas y existentes; (3) extraer solo lo que las tres páginas repiten de verdad (tabla paginada con carga, error y vacío). Sin dependencias nuevas salvo componentes shadcn que falten (`alert-dialog`).                                                                                                                                                                                                                        | Casi todo HT-04 ya existe; no se crea una librería de componentes.                                                                                     |
| D17 | Páginas `/usuarios` (solo ADMIN, ícono `UserCog`) y `/aseguradoras` (ADMIN y OPERADOR; "Nueva" y "Editar" solo ADMIN, ícono `Building2`), con el patrón de `ClientesPage` (listado en `Card` y formulario en `Dialog`). En la barra lateral, después de Pólizas y antes de Bitácora. `ClientesPage`: formulario con RN-11, errores por campo, 409 en su campo y columna "Registrado" (`createdAt`).                                                                                                                                                      | `AGENTS.md`: página nueva → `router.tsx` con roles + enlace en `AppLayout`.                                                                            |
| D18 | Pruebas: TDD de RN-11, casos de uso de usuarios y `cerrarTodas`; e2e nuevos `usuarios`, `clientes` y `aseguradoras`, y matriz de `acceso-por-rol` actualizada; Vitest de las tres páginas; Playwright `personal.spec.ts` (flujo del personal) y `responsive.spec.ts` (360 px por rol), solo Chromium.                                                                                                                                                                                                                                                    | Evidencia por criterio para el informe.                                                                                                                |
| D19 | Las pruebas que crean clientes por el API usan identificaciones válidas generadas por un helper de prueba (`cedulaValida(semilla)`), no valores fijos que choquen entre corridas.                                                                                                                                                                                                                                                                                                                                                                        | Con RN-11, `E2E-<sufijo>` deja de ser válido.                                                                                                          |

## 3. Estado de partida (verificado el 06/10/2026)

- **Usuarios:** módulo con solo `GET /usuarios` (ADMIN), que lista también cuentas CLIENTE.
  `UsuariosRepositoryPort` tiene solo `listar`. `Usuario` no tiene `nombre`;
  `PrismaUsuarioAuthRepository.nombreVisible` lo deriva del cliente o del correo.
- **Auth:** `AuthModule` exporta solo `HASHER`. `AlmacenSesionesPort` tiene `abrir`, `rotar`,
  `tocar`, `cerrar` y `cerrarDemas`; no hay forma de cerrar todas las sesiones de un usuario. El
  login ya rechaza a los inactivos (`UsuarioCredenciales.activo`), pero no hay e2e que lo pruebe.
- **Clientes y aseguradoras:** CRUD completo desde S1 (`clientes.use-cases.ts`,
  `aseguradoras.use-cases.ts`), con `DELETE` y `@Roles('ADMIN', 'OPERADOR')` en toda la clase.
  `crearClienteSchema` solo valida longitudes de 5 a 20; `crearAseguradoraSchema` exige
  `^\d{13}$`. Los duplicados ya dan `ConflictoError`, sin `details` ni traducción de `P2002`.
- **Pruebas que se rompen con este sprint:**
  - `apps/api/test/bitacora.e2e-spec.ts` (≈ L70–100) crea un cliente con `E2E<sufijo>` y lo borra
    con `DELETE`, y espera `['CREAR', 'MODIFICAR', 'ELIMINAR']`.
  - `apps/api/test/acceso-por-rol.e2e-spec.ts` (≈ L107) usa `E2E-<sufijo>` (revisa si crea por
    Prisma o por API) y su matriz incluye los `DELETE`.
  - `apps/web/src/contratos/esquemas-compartidos.spec.ts` (L106–130) usa la cédula `1712345678`,
    que **no** cumple el módulo 10.
  - `auditoria-cobertura.spec.ts` y `roles-cobertura.spec.ts` descubren las rutas solas: las nuevas
    entran sin listas manuales, pero verifica que las mutaciones nuevas declaren `@Auditar`.
- **Seed:** cédula `1710034065` (cumple el módulo 10) y aseguradora con RUC `1790012345001`
  (tercer dígito 9: pasa la regla estructural). No hace falta cambiarlos.
- **SPA:** `Providers.tsx` ya monta `QueryClientProvider` y `Toaster` de sonner; `RutaProtegida`
  por rol en `router.tsx`; `AppLayout` con barra lateral (`ENLACES`) y menú del usuario;
  `DataState.tsx` con `EsqueletoTabla`, `AvisoError` y `AvisoVacio`. Componentes shadcn: badge,
  button, card, dialog, dropdown-menu, form, input, label, select, sheet, skeleton, table y tabs
  (no hay `alert-dialog`). `features/polizas/api.ts` lista aseguradoras con `pageSize=100`.
  `BitacoraPage` tiene un mapa de etiquetas por acción. Solo `ClientesPage` existe de las tres
  páginas, sin pruebas.
- **Errores:** `ConflictoError` → 409 y `ReglaNegocioError` → 422 en `AllExceptionsFilter`, que pasa
  `detalles` a `details`.
- **Auditoría:** `AuditoriaInterceptor` toma `entidadId` de `params.id`, de `respuesta.id` o de
  `respuesta.usuario.id`; `construirDetalle` solo guarda los nombres de los campos en `MODIFICAR`.
  Nunca guarda la respuesta, así que la contraseña temporal no llega a la bitácora.
- **Migraciones:** `20260929155339_init` y `20261001213141_bitacora_solo_insercion`.
- **ADR:** el último es ADR-016 (ADR-007 está reservado en la tabla 11-1); el nuevo es ADR-017.
- **Pruebas según el informe de S3:** 30 de contratos, 106 unitarias del API (23 suites), 58 de la
  SPA (8 archivos), 96 e2e del API (6 suites) y 4 de Playwright (solo Chromium).
- **Entorno (informes de S2 y S3):**
  - `pnpm` es el binario de Windows aunque se invoque desde WSL: las variables exportadas en la
    shell no le llegan sin `WSLENV`.
  - Si Windows define `CONTRACT_ADDRESS`, esa variable pisa el `.env` local.
  - Antes de Playwright, limpia `bull:anclaje-recibos:*` si quedaron trabajos de otras corridas.
  - El nodo Hardhat puede ir nativo
    (`pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1`); API y worker se
    lanzan desde `dist` para Playwright.
  - El hook `pre-commit` falla en Windows con muchos archivos (línea de comandos demasiado larga):
    si pasa, verifica `lint` y `format:check` del monorepo y commitea con `--no-verify`, y anótalo.

## 4. Fase 0 — Preparación (0,5 h)

### T0. Rama y línea base

```bash
git switch main && git pull --ff-only
git switch -c feat/sprint-04-personal-clientes-aseguradoras
git config user.name                       # debe ser JohannCaizaguano
pnpm install --frozen-lockfile
pnpm -r build
pnpm -r lint && pnpm format:check && pnpm -r typecheck && pnpm deps:check && pnpm test
```

Verificación: el árbol está limpio y la línea base en verde. Si algo falla antes de tocar código,
detente y repórtalo.

## 5. Fase 1 — Contratos compartidos (2 h)

### T1. Validadores de RN-11 (TDD, 1 h)

**Miniprompt.**

- **Objetivo:** HU-07.1 y la regla de RUC de HU-11 (D11).
- **Archivos:**
  - nuevo `packages/shared/src/validacion/identificacion.ts`, exportado desde el `index` del
    paquete;
  - nueva prueba `apps/web/src/contratos/identificacion.spec.ts`, junto a
    `esquemas-compartidos.spec.ts`, que es donde hoy se prueban los contratos compartidos.
- **API pública:**
  - `validarCedula(valor): boolean`;
  - `validarRuc(valor): boolean`;
  - `validarPasaporte(valor): boolean`;
  - `validarIdentificacion(tipo, valor): string | null`: devuelve el mensaje en español del primer
    fallo o `null`. Ejemplos: "La cédula debe tener 10 dígitos", "Código de provincia inválido",
    "Dígito verificador de la cédula inválido", "El RUC debe tener 13 dígitos y terminar en 001".
  - `normalizarIdentificacion(tipo, valor)`: `trim`, y además mayúsculas en pasaporte.
- **Reglas exactas** (D11):
  - provincia `01`–`24` o `30`;
  - cédula con tercer dígito 0–5 y módulo 10 con coeficientes `2,1,2,1,2,1,2,1,2`, restando 9 a los
    productos mayores que 9;
  - RUC de 13 dígitos que termina en `001`: si el tercer dígito es 0–5, los 10 primeros deben ser una
    cédula válida; si es 6 o 9, solo estructura; cualquier otro tercer dígito, inválido;
  - pasaporte `^[A-Z0-9]{5,20}$` tras normalizar.
- **Restricciones:** sin dependencias, funciones puras. Pon un comentario `ponytail:` en la rama 6/9
  del RUC: "sin módulo 11: el SRI emite RUC de sociedades que no lo cumplen; si RN-11 lo exige,
  agregarlo aquí".
- **Pruebas primero:**
  - "acepta una cédula válida" (`1710034065`);
  - "rechaza una cédula con dígito verificador incorrecto" (`1712345678`);
  - "rechaza la provincia 25 y acepta la 30";
  - "rechaza una cédula con tercer dígito 6";
  - "acepta el RUC de persona natural con cédula válida";
  - "rechaza el RUC de persona natural con cédula inválida";
  - "acepta RUC de sociedad privada y pública sin módulo 11" (`1790012345001`, `1760001550001`);
  - "rechaza un RUC que no termina en 001";
  - "rechaza el tercer dígito 7 u 8 en RUC";
  - "normaliza el pasaporte a mayúsculas";
  - "rechaza un pasaporte con símbolos o de menos de 5 caracteres".
- **Verificación:** `pnpm --filter @oasis/shared build && pnpm --filter @oasis/web test contratos`.

**Ejemplo (orientativo):**

```ts
export function validarCedula(valor: string): boolean {
  if (!/^\d{10}$/.test(valor) || !provinciaValida(valor) || Number(valor[2]) >= 6) return false;
  const suma = [...valor.slice(0, 9)].reduce((acc, d, i) => {
    const producto = Number(d) * (i % 2 === 0 ? 2 : 1);
    return acc + (producto > 9 ? producto - 9 : producto);
  }, 0);
  return (10 - (suma % 10)) % 10 === Number(valor[9]);
}
```

### T2. Esquemas, acciones de auditoría y RN-11 en los esquemas (1 h)

**Miniprompt.**

- **Objetivo:** contratos de HU-04, RN-11 en clientes y aseguradoras, y las acciones de D15.
- **`packages/shared/src/schemas/usuario.schema.ts` (nuevo):**
  - `ROLES_PERSONAL = ['ADMIN', 'OPERADOR'] as const` y `rolPersonalSchema`;
  - `crearUsuarioSchema`: `email` (`z.email`, normalizado a minúsculas y sin espacios), `nombre`
    (2–120, `trim`) y `rol: rolPersonalSchema`;
  - `actualizarUsuarioSchema`: `nombre?` y `rol?`, con al menos un campo, igual que
    `actualizarClienteSchema`; `.strict()`, para que mandar `email` dé 400 y el correo no se edite
    (D7);
  - `usuarioSchema` (respuesta: `id`, `email`, `nombre`, `rol`, `activo`, `createdAt`, `updatedAt`,
    sin `clienteId` ni hash);
  - `usuarioCreadoSchema = { usuario, contrasenaTemporal }` y `contrasenaTemporalSchema =
{ contrasenaTemporal }`.
- **`cliente.schema.ts`:**
  - aplica `normalizarIdentificacion` con `transform` o `preprocess` y `validarIdentificacion` en un
    `superRefine` sobre `identificacion`, con el mensaje en `path: ['identificacion']`;
  - en `actualizarClienteSchema`, valida solo si llegan `tipoIdentificacion` e `identificacion`
    juntos. Si llega solo uno, el caso de uso valida contra el valor guardado (T7);
  - agrega `createdAt` a la respuesta si no está, que ya lo está.
- **`aseguradora.schema.ts`:** `ruc` con `validarRuc` (mensaje "RUC inválido…"); `nombre` con
  `trim`.
- **`constants/auditoria.ts`:** agrega `DESACTIVAR`, `REACTIVAR` y `RESTABLECER_CONTRASENA`.
- **Pruebas primero** (en `esquemas-compartidos.spec.ts`):
  - corrige la cédula fija por `1710034065`;
  - "rechaza crear un usuario con rol CLIENTE";
  - "rechaza editar el correo de un usuario";
  - "rechaza una cédula inválida en el registro de cliente con el mensaje en `identificacion`";
  - "normaliza el pasaporte del cliente";
  - "rechaza una aseguradora con RUC de tercer dígito 7".
- **Verificación:** `pnpm --filter @oasis/shared build && pnpm --filter @oasis/web test contratos`,
  y borra `apps/web/node_modules/.vite`.

### Verificación de la Fase 1

`pnpm --filter @oasis/shared build && pnpm -r typecheck && pnpm --filter @oasis/web test`.

## 6. Fase 2 — Usuarios del personal en el API (HU-04; 4 h)

### T3. Migración `nombre`, seed y lectura en auth (1 h)

**Miniprompt.**

- **Objetivo:** D3.
- **Pasos:**
  1. En `apps/api/prisma/schema.prisma` agrega `nombre String` a `Usuario`.
  2. Crea la migración con
     `pnpm --filter @oasis/api exec prisma migrate dev --create-only --name usuario_nombre` y edita
     el SQL en tres pasos: `ADD COLUMN "nombre" TEXT` nullable; dos `UPDATE`, uno para las filas
     con `clienteId` (desde `Cliente`: `COALESCE(razonSocial, nombres || ' ' || apellidos)`) y otro
     para el resto (`split_part(email, '@', 1)`); y `SET NOT NULL`. Así funciona sobre bases ya
     sembradas.
  3. En `prisma/seed.ts`, `create` lleva `nombre`: "Administrador Oasis", "Operador Oasis" y
     "María Fernanda Cabrera Rosero" para el cliente. No toques `update: {}`.
  4. En `PrismaUsuarioAuthRepository`, selecciona `nombre` y elimina `nombreVisible` y el `include`
     del cliente si solo servía para el nombre. Actualiza el comentario de `usuario-credenciales.ts`
     (el nombre ya no se deriva).
  5. Los e2e y las pruebas que crean usuarios con `prisma.usuario.create` deben pasar `nombre`.
- **Verificación:** `prisma migrate deploy` sobre la base de desarrollo ya sembrada, luego
  `seed` (idempotente), `pnpm --filter @oasis/api build` y `pnpm --filter @oasis/api test auth`.
  `GET /auth/me` del seed devuelve "Administrador Oasis" en una base nueva y `admin` en una base
  rellenada.

### T4. `cerrarTodas` en el almacén de sesiones (TDD, 0,75 h)

**Miniprompt.**

- **Objetivo:** D8, deuda de S3.
- **Archivos:** `apps/api/src/modules/auth/application/ports/almacen-sesiones.port.ts`,
  `.../infrastructure/security/redis-almacen-sesiones.adapter.ts` y su spec.
- **Comportamiento:** `cerrarTodas(usuarioId): Promise<void>` borra todas las llaves
  `sesion:<usuarioId>:*`:
  - usa `SCAN` con `MATCH` y `COUNT 100` en bucle hasta el cursor `0`, y `DEL` por lote (`UNLINK`
    también vale). Nunca `KEYS`;
  - envuelve la operación con el tiempo límite de `shared-kernel/tiempo-limite.ts` y, si Redis no
    responde o falla, registra la causa y lanza `ErrorDependenciaExterna`, igual que
    `cerrarDemas`;
  - si `cerrarDemas` ya recorre las llaves con `SCAN`, reutiliza ese recorrido sin duplicarlo.
- **Exporta** `ALMACEN_SESIONES` desde `AuthModule`, junto a `HASHER`.
- **Pruebas primero:**
  - "cierra todas las sesiones del usuario y deja las de otros usuarios";
  - "no falla si el usuario no tiene sesiones";
  - "lanza ErrorDependenciaExterna si Redis no responde".

### T5. Casos de uso de usuarios (TDD, 1,5 h)

**Miniprompt.**

- **Objetivo:** HU-04.1, HU-04.2, HU-04.3 (servidor) y HU-04.4, con D4 y D6 a D10.
- **Archivos en `apps/api/src/modules/usuarios/`:**
  - `domain/usuario.ts`: agrega `nombre`;
  - `application/ports/usuarios.repository.port.ts`: `crear`, `buscarPorId` (solo personal),
    `existeCorreo`, `actualizar`, `cambiarActivo`, `cambiarHash` y `contarAdminsActivos`, más una
    operación transaccional para las reglas de D9 (ver ejemplo);
  - `application/ports/generador-contrasena.port.ts` (token `GENERADOR_CONTRASENA`);
  - casos de uso, un archivo por caso: `crear-usuario`, `editar-usuario`, `desactivar-usuario`,
    `reactivar-usuario` y `restablecer-contrasena`, cada uno con su spec;
  - `infrastructure/security/crypto-generador-contrasena.adapter.ts` (`randomBytes` o `randomInt`,
    16 caracteres con mayúsculas, minúsculas y dígitos, que cumpla `contrasenaSchema`, con su
    comentario `ponytail:`);
  - `infrastructure/persistence/prisma-usuarios.repository.ts`.
- **Comportamiento:**
  - **Crear:** normaliza el correo; si ya existe (incluidas las cuentas CLIENTE), lanza
    `ConflictoError` con `{ campo: 'email', motivo: 'CORREO_DUPLICADO' }`; genera la temporal, la
    hashea con `HASHER` y crea `activo: true`; devuelve `{ usuario, contrasenaTemporal }`. El
    repositorio traduce `P2002` al mismo error.
  - **Editar:** 404 si no existe o es CLIENTE. Si el `rol` cambia y el destino es el propio actor →
    `AUTO_MODIFICACION`; si deja sin ADMIN activo → `ULTIMO_ADMIN`. Guarda y, si el rol cambió,
    llama a `cerrarTodas`. Editar solo el nombre (incluido el propio) no cierra sesiones.
  - **Desactivar:** `AUTO_MODIFICACION` si es el propio actor; `ULTIMO_ADMIN` si es el último ADMIN
    activo; marca `activo: false` y llama a `cerrarTodas`. Si ya estaba inactivo, igual llama a
    `cerrarTodas`: es idempotente, para reintentar tras un 502.
  - **Reactivar:** marca `activo: true`, sin tocar sesiones; idempotente.
  - **Restablecer:** `AUTO_MODIFICACION` si es el propio actor; genera la temporal, guarda el hash,
    llama a `cerrarTodas` y devuelve `{ contrasenaTemporal }`.
  - **Listar:** filtra `rol in [ADMIN, OPERADOR]` y ordena por `createdAt desc`.
- **Restricciones:** puertos con token `Symbol`, casos de uso sin decoradores, errores de
  `shared-kernel/domain-error.ts`. Nunca escribas la contraseña generada en logs.
- **Pruebas primero** (con dobles en memoria y un generador fijo):
  - "crea un operador con contraseña temporal hasheada y la devuelve una vez";
  - "rechaza un correo ya registrado con 409 en el campo email";
  - "no permite desactivarse a sí mismo";
  - "no permite desactivar al último administrador activo";
  - "desactiva y cierra todas las sesiones del usuario";
  - "desactivar un usuario inactivo vuelve a cerrar sus sesiones";
  - "cambiar el rol cierra las sesiones y editar solo el nombre no";
  - "no permite quitarse el rol de administrador";
  - "restablece la contraseña, cierra las sesiones y devuelve la nueva temporal";
  - "no gestiona cuentas CLIENTE (404)".

**Ejemplo (orientativo)**, la regla del último ADMIN en el repositorio:

```ts
// ponytail: dos ADMIN que se desactivan a la vez pueden ganar la carrera; techo aceptable con
// pocos administradores. Salida: SELECT … FOR UPDATE sobre los ADMIN activos.
async desactivarSiNoEsUltimoAdmin(id: string): Promise<'ok' | 'ultimo-admin'> {
  return this.prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.findUniqueOrThrow({ where: { id } });
    if (usuario.rol === 'ADMIN' && usuario.activo) {
      const activos = await tx.usuario.count({ where: { rol: 'ADMIN', activo: true } });
      if (activos <= 1) return 'ultimo-admin';
    }
    await tx.usuario.update({ where: { id }, data: { activo: false } });
    return 'ok';
  });
}
```

### T6. Controlador y módulo (0,75 h)

**Miniprompt.**

- **Objetivo:** exponer D6.
- **Archivos:** `usuarios.controller.ts` y `usuarios.module.ts`.
- **Controlador** (`@Roles('ADMIN')` en la clase):
  - `GET /usuarios` con `paginacionQuerySchema`;
  - `POST /usuarios` con `@Auditar('CREAR', 'Usuario')`, responde 201;
  - `PATCH /usuarios/:id` con `@Auditar('MODIFICAR', 'Usuario')`;
  - `POST /usuarios/:id/desactivar` con `@Auditar('DESACTIVAR', 'Usuario')`, `@HttpCode(200)`, y
    devuelve el usuario;
  - `POST /usuarios/:id/reactivar` con `@Auditar('REACTIVAR', 'Usuario')`, igual que desactivar;
  - `POST /usuarios/:id/restablecer-contrasena` con
    `@Auditar('RESTABLECER_CONTRASENA', 'Usuario')`, devuelve `{ contrasenaTemporal }`.
- El actor llega con `@UsuarioActual()`. Valida con `ZodBody` y `ZodParam(idUuidParamSchema)`. Un
  método privado `aRespuesta` arma la respuesta sin hash ni `clienteId`. Documenta en Swagger que la
  contraseña temporal se muestra una sola vez.
- **Módulo:** importa `AuthModule` (por `HASHER` y `ALMACEN_SESIONES`) e instancia cada caso de uso
  con `useFactory` + `inject`, como `PagosModule`. Comprueba que no haya ciclo de imports y que
  `pnpm deps:check` siga verde.
- **Verificación:**
  - `pnpm --filter @oasis/api test usuarios`;
  - `pnpm --filter @oasis/api test cobertura`: `roles-cobertura` y `auditoria-cobertura` aceptan
    las rutas nuevas sin listas manuales; si `auditoria-cobertura` tiene un mapa de esperados, agrega
    las cinco mutaciones;
  - `pnpm deps:check`.

### Verificación de la Fase 2

`pnpm --filter @oasis/api build && pnpm --filter @oasis/api test && pnpm deps:check`.

## 7. Fase 3 — Clientes y aseguradoras en el API (HU-07, HU-11; 2,5 h)

### T7. Clientes: RN-11, 409 por campo y retiro de `DELETE` (1,25 h)

**Miniprompt.**

- **Objetivo:** HU-07.1, HU-07.2 y HU-07.4, con D10, D11 y D13.
- **Archivos:** `clientes.controller.ts`, `clientes.use-cases.ts`, `clientes.module.ts`, el puerto
  y el repositorio de clientes, y `apps/api/test/bitacora.e2e-spec.ts`.
- **Comportamiento:**
  - `crearClienteSchema` ya valida RN-11 (T2), así que el `ZodBody` devuelve 400 `VALIDACION` con el
    detalle en `identificacion`;
  - el duplicado lanza `ConflictoError('Ya existe un cliente con esa identificación',
{ campo: 'identificacion', motivo: 'IDENTIFICACION_DUPLICADA' })`, y el repositorio traduce
    `P2002`;
  - en `ActualizarClienteUseCase`, si llega solo `tipoIdentificacion` o solo `identificacion`, valida
    la combinación resultante con `validarIdentificacion` y lanza `ValidacionError` con el campo.
    Esto no es HU-08: solo evita que el `PATCH` existente rompa RN-11;
  - la respuesta incluye `createdAt`, que ya lo hace; comprueba que sea la fecha de la base
    (HU-07.4).
- **Retira** `DELETE /clientes/:id`, `EliminarClienteUseCase`, `eliminar` del puerto y del
  repositorio, y su proveedor.
- **`bitacora.e2e-spec.ts`:** el caso de CREAR, MODIFICAR y ELIMINAR pasa a CREAR y MODIFICAR con
  una cédula válida de `cedulaValida` (D19). La prueba de que la bitácora no se borra (trigger) no
  cambia.
- **Pruebas primero** (unitarias del caso de uso):
  - "rechaza una identificación duplicada con 409 en el campo identificacion";
  - "rechaza cambiar el tipo a RUC si la identificación guardada es una cédula".
- **Verificación:** `pnpm --filter @oasis/api test clientes`.

### T8. Aseguradoras: permisos, RUC y retiro de `DELETE` (1,25 h)

**Miniprompt.**

- **Objetivo:** HU-11.1 a HU-11.4, con D10, D11, D13 y D14.
- **Archivos:** `aseguradoras.controller.ts`, `aseguradoras.use-cases.ts`,
  `aseguradoras.module.ts`, el puerto y el repositorio.
- **Comportamiento:**
  - quita `@Roles` de la clase y declara por handler: `GET` y `GET :id` con
    `@Roles('ADMIN', 'OPERADOR')`; `POST` y `PATCH` con `@Roles('ADMIN')`. Si la convención del repo
    pide `@Roles` en la clase, deja `@Roles('ADMIN')` en la clase y sobrescribe los `GET`, pero
    comprueba antes cómo resuelve `RolesGuard` el handler frente a la clase;
  - el RUC duplicado lanza `ConflictoError('Ya existe una aseguradora con ese RUC',
{ campo: 'ruc', motivo: 'RUC_DUPLICADO' })`, más la traducción de `P2002`;
  - retira `DELETE`, `EliminarAseguradoraUseCase` y `eliminar` del puerto y del repositorio.
- HU-11.4 ("sin cuenta ni acceso") se cumple por construcción: `Aseguradora` no tiene relación con
  `Usuario` y el enum `Rol` no tiene un rol de aseguradora. El informe lo cita con el esquema como
  evidencia.
- **Pruebas primero:** "rechaza un RUC duplicado con 409 en el campo ruc" y "al editar, permite
  conservar el mismo RUC".
- **Verificación:** `pnpm --filter @oasis/api test aseguradoras && pnpm --filter @oasis/api test
cobertura`.

### Verificación de la Fase 3

`pnpm --filter @oasis/api build && pnpm --filter @oasis/api test && pnpm deps:check`.

## 8. Fase 4 — Base del frontend (HT-04; 4 h)

### T9. Auditoría de HT-04 y 360 px (2,5 h)

**Miniprompt.**

- **Objetivo:** HT-04, criterios 1 a 6, con D16.
- **Paso 1, inventario:** arma en el ledger una tabla criterio → evidencia actual (archivo de prueba
  y caso), que irá al informe. Lo esperado:
  - criterio 1: `AppLayout.test.tsx`; agrega "muestra el nombre del usuario en el encabezado" si
    falta, ahora con el `nombre` real;
  - criterio 2: `AppLayout.test.tsx` y `sesion.spec.ts`;
  - criterio 3: `api-client.test.ts`;
  - criterio 4: `Providers.tsx` y las pruebas de formularios con RHF y Zod;
  - criterio 5: `responsive.spec.ts` (T15);
  - criterio 6: `flujo-completo.spec.ts`.

  Si alguno no tiene evidencia, escribe la prueba mínima.

- **Paso 2, sonner:** comprueba que las mutaciones existentes notifiquen éxito y error con
  `toast`. Solo agrega lo que falte en las pantallas que tocas en este sprint.
- **Paso 3, 360 px:** con DevTools o Playwright a 360 × 740, recorre todas las rutas de cada rol:
  `/`, `/pagos`, `/recibos`, `/recibos/:id`, `/recibos/verificar`, `/clientes`, `/polizas`,
  `/bitacora`, `/cuenta/contrasena`, y luego `/usuarios` y `/aseguradoras`. Corrige el desborde:
  - tablas dentro de un contenedor `overflow-x-auto` con su `Card` en `min-w-0`;
  - encabezados de página con `flex-wrap`;
  - textos largos (hash, correo, código) con `break-all` o `truncate` y `title`;
  - el `main` del `AppLayout` con `min-w-0`.

  El desborde horizontal de la página no se admite; el scroll interno de una tabla sí.

- **Restricciones:** no cambies tokens ni la identidad visual; `impeccable audit` y `polish` solo
  sobre lo que tocas.
- **Verificación:** `pnpm --filter @oasis/web test` y la revisión visual a 360 px.

### T10. Tabla paginada compartida y `alert-dialog` (1,5 h)

**Miniprompt.**

- **Objetivo:** D16, punto 3, y la confirmación de D17.
- **Pasos:**
  1. Agrega `alert-dialog` con la CLI de shadcn
     (`pnpm --filter @oasis/web exec shadcn add alert-dialog`), revisa que use los tokens del
     proyecto y que no traiga dependencias nuevas fuera de Radix.
  2. Si `ClientesPage`, `UsuariosPage` y `AseguradorasPage` repiten el mismo bloque "carga → error →
     vacío → tabla → paginación", extráelo a `components/TablaDatos.tsx` (o amplía `DataState.tsx`)
     con composición: el padre pasa encabezados y filas como `children`; nada de un componente
     configurado por `columns` y banderas. Usa `@tanstack/react-table` solo si ya lo usa otra página.
     Si la repetición es de menos de 10 líneas por página, no extraigas nada y anótalo.
  3. La paginación muestra "Página X de Y", anterior y siguiente con `aria-label`, deshabilitados en
     los extremos.
- **Pruebas primero:** "muestra el esqueleto mientras carga", "muestra el aviso vacío" y
  "deshabilita Anterior en la primera página".

### Verificación de la Fase 4

`pnpm --filter @oasis/web lint && pnpm --filter @oasis/web typecheck && pnpm --filter @oasis/web test`.

## 9. Fase 5 — Páginas (HU-04, HU-07, HU-11; 5 h)

### T11. `UsuariosPage` (2 h)

**Miniprompt.**

- **Objetivo:** HU-04 en la SPA, con D4, D6, D7, D9, D10 y D17.
- **Archivos:**
  - `apps/web/src/features/usuarios/{api.ts,hooks.ts}`;
  - `components/FormularioUsuario.tsx`, `components/DialogoContrasenaTemporal.tsx`;
  - `pages/UsuariosPage.tsx` y `pages/UsuariosPage.test.tsx`;
  - `app/router.tsx`: `/usuarios` bajo `RutaProtegida roles={['ADMIN']}`;
  - `components/layout/AppLayout.tsx`: entrada en `ENLACES` con `UserCog`, después de Pólizas.
- **Comportamiento:**
  - la tabla muestra nombre, correo, rol (`Badge`), estado (Activo/Inactivo) y alta;
  - "Nuevo usuario" abre un `Dialog` con RHF + `crearUsuarioSchema` (correo, nombre y `Select` de
    rol). Al guardar se abre `DialogoContrasenaTemporal`, que muestra la contraseña en `font-mono`,
    un botón "Copiar" (`navigator.clipboard`, con `toast` de éxito o un aviso si falla), el texto
    "Esta contraseña no se volverá a mostrar" y un "Listo" que la descarta del estado;
  - acciones por fila en un `DropdownMenu`: Editar (nombre y rol), Desactivar o Reactivar (con
    `AlertDialog`: "Se cerrarán todas sus sesiones") y Restablecer contraseña (con `AlertDialog` y
    luego `DialogoContrasenaTemporal`). Para la fila propia, oculta Desactivar, Restablecer y el
    cambio de rol;
  - el 409 con `details.campo` va al campo del formulario con `setError`; el 422 con
    `details.motivo` va a un `toast.error` con el `message` del servidor. Al terminar, invalida la
    consulta de usuarios.
- **Restricciones:**
  - la contraseña temporal vive solo en estado local y se descarta al cerrar el diálogo; nunca en
    React Query, `localStorage` ni logs;
  - accesibilidad: labels, el foco va a "Copiar" al abrir y el tabulador recorre el menú de
    acciones.
- **Pruebas primero:**
  - "lista usuarios del personal con su estado";
  - "muestra la contraseña temporal una sola vez tras crear";
  - "muestra el error de correo duplicado en el campo";
  - "pide confirmación antes de desactivar";
  - "no ofrece desactivarse a uno mismo".
    Usa el patrón de mock de `api` de las pruebas existentes.

### T12. `AseguradorasPage` (1,25 h)

**Miniprompt.**

- **Objetivo:** HU-11.1 a HU-11.3 en la SPA, con D14 y D17.
- **Archivos:**
  - `apps/web/src/features/aseguradoras/{api.ts,hooks.ts}`;
  - `components/FormularioAseguradora.tsx`;
  - `pages/AseguradorasPage.tsx` y `pages/AseguradorasPage.test.tsx`;
  - `router.tsx`: `/aseguradoras` bajo ADMIN y OPERADOR;
  - entrada en `ENLACES` con `Building2`.
- **Comportamiento:**
  - la tabla muestra nombre, RUC (`font-mono`) y alta, con búsqueda `q` si cabe sin esfuerzo, porque
    el API ya la soporta;
  - "Nueva aseguradora" y la acción "Editar" solo aparecen para ADMIN (`useAuthStore`);
  - el formulario se reutiliza para crear y editar, con `crearAseguradoraSchema` o
    `actualizarAseguradoraSchema`;
  - el 409 va al campo `ruc`.
- Si `features/polizas/api.ts` tiene su propio `aseguradoras()`, déjalo: pólizas es de S5.
- **Pruebas primero:**
  - "el operador ve el listado sin el botón Nueva";
  - "el administrador edita el nombre de una aseguradora";
  - "muestra RUC duplicado en el campo".

### T13. `ClientesPage`: RN-11 y fecha de creación (1,75 h)

**Miniprompt.**

- **Objetivo:** HU-07.1 a HU-07.4 en la SPA, con D17.
- **Archivos:** `features/clientes/components/FormularioCliente.tsx`, `pages/ClientesPage.tsx` y
  los nuevos `pages/ClientesPage.test.tsx` y `components/FormularioCliente.test.tsx`.
- **Comportamiento:**
  - el formulario usa `crearClienteSchema` (que ya trae RN-11) con `zodResolver`;
  - al cambiar el tipo de identificación, vuelve a validar `identificacion` (`trigger`), y el
    `placeholder` y la ayuda cambian según el tipo ("10 dígitos", "13 dígitos terminados en 001",
    "5 a 20 letras o números");
  - con RUC se muestra "Razón social"; con cédula o pasaporte, "Nombres" y "Apellidos";
  - cada campo obligatorio muestra su mensaje con `aria-invalid` y `aria-describedby` (el patrón ya
    está en `identificacion`; extiéndelo a todos);
  - el 409 va a `identificacion` con "Ya existe un cliente con esa identificación";
  - la tabla agrega la columna "Registrado" con `createdAt` en formato `es-EC`;
  - `toast` de éxito al crear.
- **No** agregues edición, desactivación, búsqueda ni filtros (HU-08 y HU-09, S5).
- **Pruebas primero:**
  - "muestra el error de cédula inválida";
  - "cambia los campos de nombre al elegir RUC";
  - "marca los obligatorios vacíos";
  - "muestra identificación duplicada en el campo";
  - "muestra la fecha de registro".

### Verificación de la Fase 5

`pnpm --filter @oasis/web lint && pnpm --filter @oasis/web typecheck && pnpm --filter @oasis/web test`,
la revisión visual a 360 px de las tres páginas y una pasada con el teclado.

## 10. Fase 6 — Evidencia e2e (4 h)

Helper común: `apps/api/test/identificaciones.ts` con `cedulaValida(semilla: number)`, que devuelve
una cédula de provincia 17 con el verificador calculado y es única por semilla (usa `Date.now()` o
un contador), y `rucSociedad(semilla)` (`179` + 7 dígitos + `001`). Playwright usa una copia mínima
en `apps/web/e2e/` (no importa archivos de `apps/api`).

### T14. e2e del API (2,5 h)

**Miniprompt.**

- **Objetivo:** un caso por criterio de HU-04, HU-07 y HU-11. Crea la app como las suites
  existentes (`cookieParser`, prefijo y `trust proxy`), con su `X-Forwarded-For` por caso.
- **`apps/api/test/usuarios.e2e-spec.ts`:**
  1. ADMIN crea un operador → 201 con `contrasenaTemporal`, sin `passwordHash`; el operador inicia
     sesión con ella (HU-04.1).
  2. Correo repetido → 409 con `details.campo = 'email'` (HU-04.2).
  3. Crear con rol CLIENTE → 400.
  4. Desactivar: la sesión abierta del operador recibe 401 en su siguiente petición y el login con
     su contraseña responde 401 genérico (HU-04.3 y la deuda de S3).
  5. Reactivar → vuelve a iniciar sesión.
  6. Restablecer → la contraseña vieja falla, la nueva entra y la sesión anterior queda cerrada
     (HU-04.4).
  7. Cambiar el rol de OPERADOR a ADMIN cierra sus sesiones.
  8. El ADMIN no puede desactivarse → 422 `AUTO_MODIFICACION`.
  9. Último ADMIN: con un solo ADMIN activo, degradarlo → 422 `ULTIMO_ADMIN`. Prepara el caso con
     un ADMIN propio y desactiva temporalmente los demás por Prisma, restaurándolos en `afterAll`;
     si eso choca con otras suites, prueba solo la unidad y anótalo.
  10. La bitácora registra `CREAR`, `DESACTIVAR`, `REACTIVAR` y `RESTABLECER_CONTRASENA` con su
      `entidadId`, y ninguna fila contiene la contraseña temporal.
  11. `GET /usuarios` no incluye cuentas CLIENTE.
- **`apps/api/test/clientes.e2e-spec.ts`:**
  1. Cédula, RUC y pasaporte válidos → 201 con `createdAt` (HU-07.1 y HU-07.4).
  2. Cédula con verificador inválido y RUC sin `001` → 400 con `details` en `identificacion`.
  3. Identificación duplicada → 409 con el mensaje claro (HU-07.2).
  4. Faltan nombres con cédula, o razón social con RUC → 400 con el campo (HU-07.3).
  5. `DELETE /clientes/:id` → 404 (la ruta ya no existe).
- **`apps/api/test/aseguradoras.e2e-spec.ts`:**
  1. ADMIN crea → 201 (HU-11.1).
  2. RUC duplicado → 409 (HU-11.2).
  3. ADMIN edita el nombre y la lista la refleja (HU-11.3).
  4. OPERADOR lista → 200; crea o edita → 403 (D14).
  5. RUC de 12 dígitos → 400.
- **`acceso-por-rol.e2e-spec.ts`:** la matriz descubre las rutas sola. Ajusta lo que espera de las
  rutas nuevas (usuarios solo ADMIN; escritura de aseguradoras solo ADMIN) y cambia el
  `E2E-<sufijo>` por `cedulaValida` si crea clientes por el API.
- **Verificación:** `pnpm test:e2e` con la infraestructura arriba. Las 9 suites en verde.

### T15. Playwright (1,5 h)

**Miniprompt.**

- **`apps/web/e2e/personal.spec.ts`**, solo Chromium y con `X-Forwarded-For` propio. Usa dos
  contextos de navegador (ADMIN y operador nuevo):
  1. el ADMIN abre `/usuarios`, crea un operador y lee la contraseña temporal del diálogo;
  2. en el otro contexto, el operador inicia sesión, abre `/clientes`, registra un cliente con una
     cédula válida y luego intenta otra vez la misma identificación, y ve el error en el campo;
  3. el ADMIN desactiva al operador;
  4. la siguiente acción del operador (navegar a `/pagos`) lo lleva a `/login`.
- **`apps/web/e2e/responsive.spec.ts`:** `viewport` 360 × 740. Para ADMIN, OPERADOR y CLIENTE,
  recorre cada ruta de su menú (más `/recibos/:id` con un recibo del seed si existe) y comprueba
  `document.documentElement.scrollWidth <= 360` tras cargar los datos. Reutiliza el login de
  `sesion.spec.ts`; no dupliques helpers si ya existen.
- **Verificación:** `pnpm --filter @oasis/web test:e2e`, con los 4 casos existentes y los nuevos en
  verde.

### Verificación de la Fase 6

`pnpm test:e2e && pnpm --filter @oasis/web test:e2e`.

## 11. Fase 7 — Documentación y cierre (3 h)

### T16. ADR-017 y documentación (1 h)

**Miniprompt.**

`docs/adr/ADR-017-validacion-identificaciones.md` (nuevo), con este contenido:

```markdown
# ADR-017 · Validación de identificaciones ecuatorianas (RN-11)

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: 4

## Contexto

HU-07 exige validar la cédula, el RUC y el pasaporte del cliente "según RN-11", pero el texto de esa
regla vive en el ERS `.docx`, que no está en el repositorio; hasta S3 el esquema solo comprobaba una
longitud de 5 a 20 caracteres. HU-11 pide además un RUC de 13 dígitos para las aseguradoras. Hace
falta una sola regla, verificable con pruebas, para ambos casos.

## Decisión

- Las validaciones viven en `@oasis/shared` (`validacion/identificacion.ts`) y las usan los
  esquemas Zod de cliente y aseguradora: el API y la SPA aplican la misma regla.
- **Cédula:** 10 dígitos; provincia 01–24 o 30; tercer dígito menor que 6; dígito verificador
  módulo 10 (coeficientes 2,1,2,1,2,1,2,1,2).
- **RUC:** 13 dígitos terminados en `001` y provincia válida. Tercer dígito 0–5 (persona natural):
  los 10 primeros son una cédula válida. Tercer dígito 6 (pública) o 9 (sociedad privada): solo
  estructura, sin módulo 11. Cualquier otro tercer dígito es inválido.
- **Pasaporte:** 5 a 20 caracteres alfanuméricos; se guarda en mayúsculas.
- Antes de validar se quitan los espacios de los extremos. Los mensajes de error están en español y
  señalan el campo `identificacion` (o `ruc`).
- Las aseguradoras usan la misma regla de RUC.

## Alternativas descartadas

- **Módulo 11 estricto en el RUC de sociedades:** el SRI emite RUC de sociedades que no cumplen el
  dígito verificador; el sistema rechazaría clientes y aseguradoras reales.
- **Solo longitud:** no cumple RN-11 ni detecta errores de digitación en la cédula.
- **Consultar el SRI en línea:** agrega una dependencia externa al registro, sin API oficial
  estable y sin necesidad para el alcance del proyecto.

## Consecuencias

- Positivas: una sola regla en un solo archivo, con pruebas, para el API y la SPA; el operador ve el
  error al escribir, antes de enviar.
- Negativas: un RUC de sociedad mal digitado con estructura correcta pasa la validación. Los datos de
  prueba deben usar identificaciones válidas (`cedulaValida` en `apps/api/test/identificaciones.ts`).
  Si el texto de RN-11 del ERS resulta más estricto, se ajusta este archivo y este ADR.
```

En `docs/adr/README.md`, agrega la fila: `| ADR-017 | Validación de identificaciones ecuatorianas
(RN-11) | S4 | ADR-017-validacion-identificaciones.md |`, con el formato de las demás.

- **`CLAUDE.md`:**
  - en "Sesiones (ADR-016)", agrega `cerrarTodas` (desactivar, cambiar el rol y restablecer);
  - en "Configuración y datos", nota que `Usuario.nombre` es una columna;
  - en "Pruebas", agrega `cedulaValida` (`test/identificaciones.ts`) para crear clientes por el API.
- **`apps/api/src/modules/README.md`:** si lista rutas o exenciones, agrega usuarios y las acciones
  nuevas; anota que `aseguradoras` declara `@Roles` por handler.
- **`AGENTS.md`:** solo si alguna regla cambió; no se espera.
- **`README.md`:** si describe pantallas o usuarios del seed, agrega Usuarios y Aseguradoras.

## 12. Cierre (2 h)

### 12.1 Definición de Terminado

Antes de la DoD, revisa el diff completo con `ponytail-review` y corrige lo que señale dentro del
alcance; lo demás va como deuda al informe.

Con PostgreSQL y Redis de `compose.dev.yaml` y el nodo Hardhat:

```bash
pnpm install --frozen-lockfile
pnpm -r build
pnpm -r lint
pnpm format:check
pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                                             # contratos, API y SPA
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # aplica usuario_nombre
pnpm --filter @oasis/api seed
pnpm test:e2e                                         # 9 suites
pnpm --filter @oasis/web test:e2e                     # flujo completo, sesión, personal y 360 px
```

Pruebas manuales (anota el resultado en el informe):

- El ADMIN crea un operador, copia la contraseña con el botón y el operador entra con ella en otra
  ventana; al desactivarlo, la ventana del operador vuelve al login en su siguiente acción.
- El menú del OPERADOR muestra Aseguradoras sin "Nueva" y no muestra Usuarios; `/usuarios` lo
  redirige al inicio.
- Las tres páginas a 360 px, con teclado y con lector de pantalla (anuncio del diálogo de la
  contraseña temporal y de los errores por campo).

### 12.2 Informe del sprint

Crea `docs/sprints/sprint-04.md` con la estructura de `sprint-03.md`:

1. **Encabezado:** historias, épicas (EP-07, EP-01, EP-02 y EP-03), rama, fechas y estado.
2. **Objetivo.**
3. **Entregables:** tabla con su ubicación.
4. **Criterios de cada historia con su evidencia** (sección 14).
5. **Definición de Terminado:** tabla de estado.
6. **Versiones:** solo si se actualizó alguna dependencia (no se espera; `alert-dialog` es código
   de shadcn y puede sumar `@radix-ui/react-alert-dialog`: anótalo).
7. **Decisiones y discrepancias:**
   - ADR-017;
   - el texto de RN-11 no está en el repo y se fijó por ADR;
   - se retiró `DELETE` de clientes y aseguradoras por RN-09;
   - `Usuario.nombre` no estaba en el modelo de ADR-010;
   - el criterio literal de HU-11 ("RUC de 13 dígitos") se amplió con la regla estructural de
     RN-11;
   - la tabla 6-1 de la arquitectura dice NestJS 12 y se usa 11 (desde S1).
8. **Impedimentos y observaciones:** incluye que las bases ya sembradas toman como nombre la parte
   local del correo.
9. **Deuda y fuera de alcance:**
   - cambio obligatorio de la temporal en el primer ingreso, para el personal y los clientes
     (HU-05, S10);
   - HU-08 y HU-09 (S5);
   - CLIENTE en la verificación (S8);
   - recuperación de contraseña (S13);
   - Firefox y WebKit (S15);
   - la carrera del último ADMIN (`ponytail:`).
10. **Acciones del autor:** agregar ADR-017 a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md` y
    confirmar el texto de RN-11 contra el ERS.
11. **Pruebas manuales** y **Cómo verificar** (los comandos de 12.1).

## 13. Commit y entrega

Revisa con `git status` que no entren `.env`, `.claude/`, `.superpowers/`, `*.docx`,
`ignition/deployments/chain-31337` ni artefactos. Comprueba `git config user.name`
(`JohannCaizaguano`). Haz un solo commit, **sin** líneas `Co-Authored-By` ni "Generated with":

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint 4 con usuarios del personal, clientes y aseguradoras

- HT-04: auditoría de la base de la SPA, 360 px en todas las pantallas, tabla paginada y
  alert-dialog.
- HU-04: alta con contraseña temporal generada, edición de nombre y rol, desactivar y reactivar,
  restablecer contraseña; cierre de todas las sesiones y protección del último administrador.
- HU-07: RN-11 para cédula, RUC y pasaporte, 409 por campo y fecha de registro.
- HU-11: aseguradoras con RUC validado, escritura solo para ADMIN y edición.
- Se retira DELETE de clientes y aseguradoras (RN-09); migración usuario_nombre.
- Docs: ADR-017, CLAUDE.md, plan e informe del sprint 4.

Refs: HT-04, HU-04, HU-07, HU-11
EOF
```

No hagas push. Termina con un mensaje al usuario que incluya:

- el resumen de la verificación de 12.1 y de las pruebas manuales;
- el recordatorio de agregar ADR-017 a la tabla 11-1 y de confirmar RN-11 contra el ERS;
- el título del PR (el encabezado del commit);
- este cuerpo de PR, listo para pegar y sin líneas de atribución:

```markdown
## Resumen

Sprint 4: base de la SPA auditada y adaptada a 360 px (HT-04), gestión de usuarios del personal
con cierre de sesiones (HU-04), registro de clientes con RN-11 (HU-07) y catálogo de aseguradoras
(HU-11). Informe: `docs/sprints/sprint-04.md`.

## Criterios de aceptación

- [x] HT-04: layout y sonner; rutas por rol; renovación ante 401; Query y RHF + Zod; 360 px; login
- [x] HU-04: alta con temporal; correo único; desactivado sin acceso; restablecer contraseña
- [x] HU-07: RN-11; duplicado con mensaje claro; obligatorios; fecha de creación
- [x] HU-11: nombre y RUC; RUC duplicado; listar y editar; sin cuenta ni acceso

## Pendiente

- Agregar ADR-017 a la tabla 11-1 de la arquitectura y confirmar RN-11 contra el ERS.
- Aceptación del Product Owner en la revisión del sprint.
```

## 14. Trazabilidad criterio → evidencia

| Criterio                                        | Evidencia                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| HT-04.1 layout, usuario y sonner                | `AppLayout.test.tsx`; pruebas de las páginas con `toast`                                                     |
| HT-04.2 rutas por rol                           | `AppLayout.test.tsx`; `sesion.spec.ts`; pruebas manuales del OPERADOR                                        |
| HT-04.3 renovación ante 401                     | `api-client.test.ts`                                                                                         |
| HT-04.4 TanStack Query y RHF + Zod              | `Providers.tsx`; pruebas de `FormularioUsuario`, `FormularioAseguradora` y `FormularioCliente`               |
| HT-04.5 desde 360 px                            | `responsive.spec.ts`                                                                                         |
| HT-04.6 login de extremo a extremo              | `flujo-completo.spec.ts`; `personal.spec.ts`                                                                 |
| HU-04.1 alta con correo, nombre, rol y temporal | `crear-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 1; `UsuariosPage.test.tsx`; `personal.spec.ts` |
| HU-04.2 correo único                            | `crear-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 2; `UsuariosPage.test.tsx`                     |
| HU-04.3 desactivado sin acceso                  | `desactivar-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 4; `personal.spec.ts`                     |
| HU-04.4 restablecer contraseña                  | `restablecer-contrasena.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 6                                     |
| HU-07.1 RN-11                                   | `identificacion.spec.ts`; `clientes.e2e-spec.ts` casos 1 y 2; `FormularioCliente.test.tsx`; ADR-017          |
| HU-07.2 duplicado con mensaje claro             | `clientes.use-cases` spec; `clientes.e2e-spec.ts` caso 3; `ClientesPage.test.tsx`; `personal.spec.ts`        |
| HU-07.3 obligatorios con mensaje                | `esquemas-compartidos.spec.ts`; `clientes.e2e-spec.ts` caso 4; `FormularioCliente.test.tsx`                  |
| HU-07.4 fecha de creación                       | `clientes.e2e-spec.ts` caso 1; `ClientesPage.test.tsx`                                                       |
| HU-11.1 nombre y RUC de 13 dígitos              | `aseguradoras.e2e-spec.ts` casos 1 y 5; `identificacion.spec.ts`                                             |
| HU-11.2 RUC duplicado                           | `aseguradoras.use-cases` spec; `aseguradoras.e2e-spec.ts` caso 2                                             |
| HU-11.3 listar y editar                         | `aseguradoras.e2e-spec.ts` caso 3; `AseguradorasPage.test.tsx`                                               |
| HU-11.4 sin cuenta ni acceso                    | `schema.prisma` (sin relación con `Usuario` ni rol propio); `aseguradoras.e2e-spec.ts` caso 4                |
| Deuda S3: cierre de sesiones al desactivar      | `redis-almacen-sesiones.adapter.spec.ts`; `usuarios.e2e-spec.ts` casos 4, 6 y 7                              |

## 15. Estimación

| Fase | Tareas                                                   | Historia            |  Horas |
| ---- | -------------------------------------------------------- | ------------------- | -----: |
| 0    | Rama y línea base (T0)                                   | HT-04               |    0,5 |
| 1    | RN-11, esquemas y acciones (T1 y T2)                     | HU-07, HU-04, HU-11 |      2 |
| 2    | Usuarios en el API (T3 a T6)                             | HU-04               |      4 |
| 3    | Clientes y aseguradoras en el API (T7 y T8)              | HU-07, HU-11        |    2,5 |
| 4    | Base del frontend y 360 px (T9 y T10)                    | HT-04               |      4 |
| 5    | Páginas de usuarios, aseguradoras y clientes (T11 a T13) | HU-04, HU-11, HU-07 |      5 |
| 6    | e2e del API y Playwright (T14 y T15)                     | Todas               |      4 |
| 7    | ADR, documentación, DoD, informe y commit (T16 y 12)     | Todas               |      3 |
|      | **Total**                                                |                     | **25** |

En el informe, las horas por historia siguen el backlog: HT-04 10 h, HU-04 5 h, HU-07 6 h y HU-11
4 h. El sprint usa las 25 h de capacidad sin reserva: si falta tiempo, recorta primero T10 (la
extracción de la tabla es opcional según su propio criterio) y la búsqueda de `AseguradorasPage`.
