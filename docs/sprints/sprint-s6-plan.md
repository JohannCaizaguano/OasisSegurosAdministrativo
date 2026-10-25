# Sprint S6 — Plan de implementación

- **Historias:** HU-05 Crear cuenta de cliente (4 h), HU-10 Ficha del cliente (4 h), HU-15 Saldo
  pendiente (4 h), HU-33 Aceptar la política de datos (3 h), HU-34 Importar clientes y pólizas
  (9 h), HU-53 Solicitudes del titular de datos (4 h), HT-12 Notificaciones por correo (6 h), HU-27
  Anular recibo (8 h), HU-29 Mis pólizas y pagos (9 h) y HU-39 Notificar validación o rechazo (3 h).
- **Horas:** 54 h de backlog. El informe reporta solo las horas de backlog (D23).
- **Épicas:** EP-01 (HU-05, HU-33), EP-02 (HU-10, HU-34, HU-53), EP-03 (HU-15), EP-04 (HU-39),
  EP-05 (HU-27), EP-06 (HU-29) y EP-07 (HT-12).
- **Fechas:** 16/11/2026 – 27/11/2026 (tabla 6-1).
- **Rama:** `feat/sprint-s6-portal-importacion`. Un solo commit y un solo PR.
- **Ejecuta:** la sesión principal con `subagent-driven-development` y los agentes de área de
  `.opencode/agents/` (sección 0.1).
- **Decisiones acordadas con el desarrollador:** 23/10 y 24/10/2026, en sesiones de grilling
  (sección 2).

Este documento es el Sprint Backlog de S6. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.
Cada agente lee los tres antes de empezar. La fuente de verdad está en `docs/referencia/`, que no se
edita: si algo de este plan la contradice, gana la referencia; detente y repórtalo.

**Cómo leer las tareas.** Cada tarea indica su **agente**, sus **archivos**, sus **skills**, el
comportamiento esperado, los casos borde, las pruebas que se escriben primero y su verificación. Los
bloques **Ejemplo (orientativo)** muestran la forma o la parte delicada; se adaptan al código real.

## 0. Reglas de ejecución

1. La sesión principal ejecuta las fases en orden: 0 → 1 → 2 → 3 → 4 → 5. Ningún agente arranca una
   fase por su cuenta.
2. TDD en toda lógica nueva (`test-driven-development`): primero la prueba en rojo, luego el código.
   Antes de cerrar una fase, la sesión principal usa `verification-before-completion` y guarda la
   salida en el ledger.
3. Cada agente invoca al empezar las skills de su tarea en el orden de `AGENTS.md`: proceso →
   tecnología → `ponytail` decide el tamaño.
4. Tras cambiar `packages/shared/src`: `pnpm --filter @oasis/shared build` y borrar
   `apps/web/node_modules/.vite`.
5. Nunca se edita `docs/referencia/`.
6. **Un solo commit** al final (T27), hecho por la sesión principal, sin líneas de atribución. Antes,
   `git config user.name` debe ser `JohannCaizaguano`. **Sin push ni PR**: los hace el usuario.
7. No se adelanta trabajo de otros sprints; lo que exceda el alcance va como deuda al informe.
8. Comentarios solo para el porqué no obvio. Simplificaciones deliberadas con `ponytail:` (techo y
   salida).
9. En la fase paralela cada agente compila y prueba **solo su paquete** (`pnpm --filter …`); nadie
   ejecuta `pnpm -r build` ni `pnpm install` hasta que la sesión principal cierre la fase.
10. Las dependencias nuevas las instala **la sesión principal** en T0: los agentes no editan
    `package.json` ni el lockfile.
11. **Punto de control antes del commit (D22):** la sesión principal se detiene en T25, presenta las
    capturas de las pantallas y correos nuevos y espera un «aprobado» explícito.

### 0.1 Agentes y coordinación

| Agente            | Edita                                                                       | Fases | Tareas            |
| ----------------- | --------------------------------------------------------------------------- | ----- | ----------------- |
| sesión principal  | archivos raíz (`package.json`, `.env*.example`), `apps/web/public/`, ledger | 0–5   | T0, T24, T25, T27 |
| `contrato-shared` | `packages/shared/src/` (salvo `abi/`), `apps/web/src/contratos/`            | 1     | T1–T4             |
| `documentacion`   | `docs/` (salvo `referencia/`), `CLAUDE.md`, `AGENTS.md`, READMEs            | 1, 5  | T5, T26           |
| `infra`           | `infra/`, `compose.*.yaml`, `Dockerfile`, `Caddyfile`, `.github/`           | 1     | T6                |
| `backend-api`     | `apps/api/src/`, `apps/api/prisma/`                                         | 2, 4  | T7–T15            |
| `frontend-spa`    | `apps/web/src/` (salvo `contratos/`)                                        | 3, 4  | T16–T20           |
| `verificador`     | `apps/api/test/`, `apps/web/e2e/`                                           | 4     | T21, T22          |
| `revisor`         | nada (solo su nota del ledger)                                              | 4     | T23               |

```text
Fase 0  sesión principal ── T0 arrastre de S5, rama, dependencias, variables, isologo público, línea base
Fase 1  contrato-shared ── T1 → T2 → T3 → T4    documentacion ── T5    infra ── T6 Mailpit (en paralelo)
Fase 2  backend-api ── T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15
Fase 3  frontend-spa ── T16 → T17 → T18 → T19 → T20
Fase 4  verificador ── T21 → T22 · revisor ── T23 → dueños corrigen → revisor confirma (máx. 1 ronda)
Fase 5  sesión principal ── T24 DoD, T25 capturas y PUNTO DE CONTROL ·
        documentacion ── T26 · sesión principal ── T27 informe y commit
```

**Orden dentro del backend.** La migración (T7) va primero; el correo (T8) va antes que las cuentas
de cliente (T9) y los avisos de pago (T13), porque ambos lo usan. La anulación (T14) va después de
las solicitudes del titular (T12) porque las dos tocan `Recibo` y comparten la migración.

**La SPA va después del backend.** Las pantallas consumen los endpoints, errores y respuestas reales;
la sesión principal pasa a `frontend-spa` el resumen exacto al cerrar la Fase 2.

**Traspasos.** Cada agente cierra su tarea con una nota en `.superpowers/sdd/sprint-s6-plan/<agente>.md`
(qué hizo, salida resumida de sus comandos, desvíos con su motivo y lo que necesita el siguiente) y
responde a la sesión principal con un resumen corto.

**Fronteras.** Si un agente necesita un cambio fuera de su carpeta, no lo hace: lo anota y la sesión
principal relanza al dueño. Si el `verificador` encuentra un bug de producto, deja la prueba en rojo
como evidencia.

**Frenos.** Si una decisión de la sección 2 deja de ser viable, la sesión principal se detiene e
invoca `grilling` con su recomendación. Los agentes no reabren decisiones.

### 0.2 Skills por tarea

| Momento                        | Agente            | Skills                                                                                                                                                                      |
| ------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo el sprint                 | sesión principal  | `subagent-driven-development`, `ponytail`, `verification-before-completion`; `grilling` solo como freno                                                                     |
| Toda lógica nueva              | todos             | `test-driven-development`                                                                                                                                                   |
| Fallo o prueba roja inesperada | todos             | `systematic-debugging`                                                                                                                                                      |
| T1–T4 esquemas                 | `contrato-shared` | `zod`, `typescript-advanced-types`, `vitest`                                                                                                                                |
| T5 y T26 documentación         | `documentacion`   | `humanizador-es` al final de cada documento                                                                                                                                 |
| T6 Mailpit                     | `infra`           | —                                                                                                                                                                           |
| T7 migración                   | `backend-api`     | `prisma-cli`, `prisma-client-api`, `prisma-postgres`                                                                                                                        |
| T8–T15 API y worker            | `backend-api`     | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`, `prisma-client-api`                                                                            |
| T16–T20 SPA                    | `frontend-spa`    | `react-best-practices`, `composition-patterns`, `react-hook-form`, `zod`, `shadcn`, `impeccable` (`craft`, `harden`), `frontend-design` (portal), `accessibility`, `vitest` |
| T21 e2e del API                | `verificador`     | `nestjs-best-practices`, `prisma-client-api`                                                                                                                                |
| T22 Playwright                 | `verificador`     | `playwright-best-practices`                                                                                                                                                 |
| T23 revisión                   | `revisor`         | `ponytail-review`, `accessibility`, `impeccable` (`audit`)                                                                                                                  |

**`impeccable`.** Manda `apps/web/DESIGN.md`. Toda pantalla nueva usa `EstadoInsignia`, los botones y
campos de S4 y la regla del oro. El portal del cliente sigue la sección «Portal» de DESIGN.md
(héroe, una columna, cuerpo de 16 px, barra inferior, objetivos ≥ 44 px).

**Sin worktrees ni commits por tarea.** Ledger y capturas en `.superpowers/sdd/sprint-s6-plan/`
(ignorado por git).

## 1. Alcance

### HU-05 — Crear cuenta de cliente (RF-06)

- La cuenta se vincula a un único cliente y su rol es CLIENTE.
- La contraseña temporal debe cambiarse en el primer ingreso.
- No se permite más de una cuenta por cliente.

### HU-10 — Ficha del cliente (RF-11)

- La ficha muestra datos de contacto, pólizas y pagos con su estado.
- Desde la ficha se accede a los recibos del cliente.

### HU-15 — Saldo pendiente de la póliza (RF-16)

- El saldo es la prima total menos los pagos validados.
- Se muestra en la póliza y en el portal del cliente, y se actualiza al validar un pago.

### HU-33 — Aceptar la política de tratamiento de datos (RF-38)

- En el primer ingreso se muestra la política y se exige aceptarla para continuar.
- Se registran la fecha, la hora y la versión aceptada.
- Si la política cambia, se pide una nueva aceptación.

### HU-34 — Importar clientes y pólizas (RF-39, RNF-28, RNF-37)

- Plantilla .xlsx o CSV descargable desde el sistema.
- Cada fila se valida con las reglas del registro manual.
- Vista previa con las filas válidas y los errores por fila antes de confirmar.
- Solo se importan las filas válidas y se genera un resumen.
- La plantilla de pólizas incluye cobertura y condiciones (HU-51).
- Archivo de hasta 5 MB y 5 000 filas, procesado con SheetJS 0.20.3 instalado desde su CDN oficial.

### HU-53 — Solicitudes del titular de datos (RF-59, RNF-43)

- Se registra la solicitud con tipo, fecha y vencimiento a 10 días; el listado destaca las próximas
  a vencer.
- El acceso genera un archivo con los datos personales del cliente y sus pólizas, pagos y recibos.
- La eliminación anonimiza los datos personales y borra el contenido y la sal de los recibos sin
  borrar registros (RN-09).
- Cada solicitud y su resolución quedan en la bitácora.

### HT-12 — Notificaciones por correo (RNF-25)

- `NotificacionesPort` con un adaptador SMTP con Nodemailer.
- Envío desde la cola `notificaciones` del worker, con reintentos.
- Plantillas con la identidad visual de Oasis Seguros.
- Credenciales SMTP por variables de entorno.

### HU-27 — Anular recibo (RF-32)

- Solo el ADMIN y solo recibos ANCLADOS.
- El motivo es obligatorio y su hash se registra con `anular()` en el contrato.
- El recibo pasa a ANULADO y no se elimina (RN-05); la verificación muestra Anulado.

### HU-29 — Mis pólizas y pagos (RF-22, RNF-36)

- El cliente solo ve sus propios datos; se muestran el estado de cada pago y de cada recibo.
- El cliente accede a sus recibos imprimibles y ve el saldo de cada póliza.
- e2e: un cliente que cambia el identificador en la URL recibe 404 en pólizas, pagos y recibos
  ajenos.

### HU-39 — Notificar la validación o el rechazo del pago (RF-44)

- Al validar se envía un correo con el enlace de verificación del recibo; al rechazar, con el
  motivo.
- El envío no retrasa la respuesta al operador.

### Deuda que entra por historia

- Cambio obligatorio de la contraseña temporal (deuda de S2) → HU-05 (D2).
- Cuenta del cliente al desactivarlo (deuda de S3) → HU-05 (D3).
- Búsqueda sin tildes (deuda D8 de S3) → HU-10 (D8).

### Fuera de alcance (no implementar)

- Recuperar contraseña por correo (HU-31, S7).
- Pagos notificados por la aseguradora (HU-50, S7): reutilizará la infraestructura de importación.
- Recordatorio de cuotas (HU-40, S9), correos de seguridad (HU-52, S8), actualizar contacto (HU-47,
  S9).
- Brevo configurado en el servidor de producción: HT-06 (S7).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Motivo                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | **Cuenta de cliente (HU-05)**: `POST /clientes/:id/cuenta` (ADMIN, `@Auditar('CREAR', 'Usuario')`) con `{ email? }` (por defecto `cliente.email`). Genera una contraseña temporal, la responde **una sola vez** en `{ usuario, contrasenaTemporal, correoEnviado }` y, si hay correo, encola además la plantilla `cuenta-creada` al cliente (D15) con la contraseña temporal y el enlace de inicio de sesión. Sin correo → `correoEnviado: false` y la SPA indica entregarla por otro medio. Cliente inactivo → 422 `CLIENTE_INACTIVO`; ya tiene cuenta → 409 `CUENTA_EXISTENTE` (`Usuario.clienteId @unique`); correo usado por otro usuario → 409 `EMAIL_DUPLICADO`. La contraseña nunca va a logs ni a la bitácora, y el job se elimina al completarse.                                                                                                                                                                                                | Cumple el criterio literal y Oasis lo opera sin dictar contraseñas; el cambio obligatorio (D2) acota el riesgo (grilling del 24/10). |
| D2  | **Contraseña temporal obligatoria** (deuda de S2): columna `Usuario.debeCambiarContrasena` (por defecto `false`), `true` al crear una cuenta (HU-05 y HU-04) y al restablecerla (HU-04). El access token lleva el claim `dc: true`. Guard global `CambioPendienteGuard` (tras `RolesGuard`) responde 403 `CAMBIO_CONTRASENA_REQUERIDO` salvo en handlers con `@PermitirConCambioPendiente()` (`/auth/me`, `/auth/logout`, `/auth/refresh`, `/auth/cambiar-contrasena`). Cambiar la contraseña pone el flag en `false` y emite tokens nuevos. La SPA redirige a `/cambiar-contrasena` en modo obligatorio.                                                                                                                                                                                                                                                                                                                                                 | Criterio de HU-05.                                                                                                                   |
| D3  | **Cliente y cuenta**: desactivar un cliente desactiva su `Usuario` y llama a `cerrarTodas` (deuda de S3); **reactivarlo reactiva también la cuenta**, con sus sesiones ya cerradas. Estados de cuenta en la ficha (`EstadoInsignia`, dominio `cuenta`): Sin cuenta · Pendiente de primer ingreso · Activa · Desactivada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Grilling del 24/10.                                                                                                                  |
| D4  | **Política (HU-33)**: constante `POLITICA_DATOS_VERSION = '1.0'` en `@oasis/shared`. Tabla `AceptacionPolitica` (`id`, `usuarioId`, `version`, `aceptadaEn`, `ip`) como historial; `Usuario.politicaVersion` y `politicaAceptadaEn` guardan la vigente. Solo CLIENTE: claim `pp: true` si `politicaVersion !== POLITICA_DATOS_VERSION`; un guard con el mismo patrón de D2 responde 403 `POLITICA_PENDIENTE` salvo `@PermitirConPoliticaPendiente()` (`/auth/*` y `POST /politica/aceptar`). `POST /politica/aceptar { version }` exige la versión vigente (si no → 422 `VERSION_POLITICA_INVALIDA`), registra y emite tokens nuevos. Auditado como `ACEPTAR` sobre `Politica` (acción nueva). Orden en la SPA: primero la contraseña, luego la política.                                                                                                                                                                                                 | Criterio de HU-33; el historial demuestra cada aceptación.                                                                           |
| D5  | El texto de la política vive en `docs/proteccion-datos/politica-tratamiento-datos-v1.0.md` (HT-16) y la SPA lo muestra desde `features/politica/PoliticaV1.tsx`, transcrito. `ponytail:` techo: copia manual por versión; salida: importar el Markdown con `?raw` y un renderizador cuando haya más de una versión.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Una sola versión hoy.                                                                                                                |
| D6  | **Saldo (HU-15)**: `polizaSchema` suma `saldo: string` (ADR-020: `primaTotal − Σ VALIDADOS`), calculado con un `groupBy` por la página de pólizas (una consulta) en el listado y con `aggregate` en el detalle, también en `/mis-polizas`. La SPA invalida `['polizas']` y `['poliza', id]` al validar, rechazar o anular.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Sin N+1.                                                                                                                             |
| D7  | **Ficha (HU-10)**: `ClienteDetallePage` (`/clientes/:id`) compone lo existente: `GET /clientes/:id` (suma `cuenta: { estado, email } \| null`), `GET /polizas?clienteId=` (con `saldo` y `enMora`), `GET /pagos?clienteId=` y `GET /recibos?clienteId=` (filtro nuevo). Acciones: editar (diálogo de S3), crear cuenta (D1), registrar solicitud del titular (D12). Los nombres de cliente en las tablas enlazan a la ficha.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Reutiliza endpoints; un filtro nuevo.                                                                                                |
| D8  | **Búsqueda sin tildes** (deuda D8 de S3): columna `Cliente.busqueda` (minúsculas y sin diacríticos de nombres, apellidos, razón social, identificación y correo), escrita por el repositorio en crear, editar e importar con `normalizarBusqueda()` de `@oasis/shared`; la migración crea la extensión `unaccent` solo para el backfill (`lower(unaccent(…))`). La búsqueda compara cada palabra normalizada con `busqueda`. Se retira el `ponytail:` de `prisma-clientes.repository.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | La misma función normaliza en la escritura y en la búsqueda.                                                                         |
| D9  | **Importación (HU-34, ADR-022)**: el **API** procesa el archivo. `POST /importaciones/vista-previa` (multipart, `tipo=CLIENTES\|POLIZAS`, `FileInterceptor` en memoria con límite de 5 MB, comprobación de firma: ZIP `PK\x03\x04` para .xlsx o texto UTF-8 para .csv) lee con SheetJS (`cellFormula: false`, `cellHTML: false`, `sheetRows: 5001`), valida cada fila y guarda en Redis `importacion:<uuid>` (TTL 30 min, con `usuarioId`) las filas normalizadas. Responde `{ id, validas: [...], errores: [{ fila, columna, mensaje }], total }`. Más de 5 000 filas → 422 `DEMASIADAS_FILAS`; más de 5 MB → 413.                                                                                                                                                                                                                                                                                                                                       | Criterio literal; el archivo nunca toca el disco.                                                                                    |
| D10 | `POST /importaciones/:id/confirmar` (`{ confirmado: true }`, `@Auditar('IMPORTAR', 'Importacion')`): solo el mismo usuario (otro → 404); **revalida** la unicidad (pudo cambiar en 30 min) e inserta las válidas en lotes de 500, cada lote en su `$transaction`; lo que falle en la revalidación pasa a `errores`. Crea `Importacion` (`id`, `tipo`, `archivoNombre`, `totalFilas`, `importadas`, `conError`, `usuarioId`, `creadoEn`, `resumen Json`), que HU-50 reutiliza. Una identificación o un número de póliza que **ya existe es error de fila** («Ya existe»), nunca actualización.                                                                                                                                                                                                                                                                                                                                                             | La importación es para la carga inicial; un archivo equivocado no sobrescribe datos buenos (grilling del 24/10).                     |
| D11 | **Plantillas** `GET /importaciones/plantillas/:tipo?formato=xlsx\|csv` generadas con SheetJS: fila de encabezados, una fila de ejemplo y, en .xlsx, una hoja «Instrucciones». Clientes: `tipoIdentificacion, identificacion, nombres, apellidos, razonSocial, email, telefono`. Pólizas: `numero, identificacionCliente, rucAseguradora, ramo, primaTotal, fechaInicio, fechaFin, numeroCuotas, cobertura, condiciones` (`ramo` por código o nombre; `numeroCuotas` opcional, por defecto 1, con `proponerPlanCuotas`). Fechas `dd/mm/aaaa`, ISO o número de serie de Excel; montos `1234.50` o `1.234,50`. Si los Excel de Oasis (pedidos el 13/11) traen otras columnas, se ajustan los encabezados con alias, sin cambiar las reglas.                                                                                                                                                                                                                  | Criterios de HU-34 y HU-51.                                                                                                          |
| D12 | **Solicitudes del titular (HU-53)**: modelo `SolicitudTitular` (`id`, `clienteId`, `tipo` ACCESO\|RECTIFICACION\|ELIMINACION, `recibidaEn`, `venceEn` = `recibidaEn` + **10 días calendario**, `estado` PENDIENTE\|RESUELTA\|RECHAZADA, `resueltaEn`, `resueltaPorId`, `nota`). Endpoints `POST /solicitudes-titular`, `GET /solicitudes-titular` (orden por `venceEn`; `porVencer` si faltan ≤ 2 días) y `POST /solicitudes-titular/:id/resolver`; ADMIN y OPERADOR, salvo la eliminación (D13); auditados (`CREAR`, `RESOLVER` sobre `SolicitudTitular`).                                                                                                                                                                                                                                                                                                                                                                                               | Días calendario: lo más conservador (grilling del 24/10); Oasis valida la redacción.                                                 |
| D13 | **Acceso**: resolver una ACCESO habilita `GET /solicitudes-titular/:id/exportacion` (JSON UTF-8 con `Content-Disposition: attachment`): datos personales del cliente, sus pólizas (con cobertura), pagos y recibos (código, estado y fechas; **sin** sal ni payload). **Rectificación**: se resuelve con nota tras editar al cliente. **Eliminación** (**solo ADMIN**, confirmación roja): en una transacción anonimiza `Cliente` (nombres «Titular», apellidos «anonimizado», razón social nula, identificación `ANON-<8 hex>`, correo `anonimizado+<id>@invalid.local`, teléfono nulo, `busqueda` nula, `activo` false), desactiva y anonimiza su `Usuario` (y `cerrarTodas`), y en sus recibos pone `sal = ''`, `payloadCanonico = ''` y `anonimizadoEn = now()`. La verificación de un recibo anonimizado responde NO_ENCONTRADO. Acción de bitácora `ANONIMIZAR` sobre `Cliente`; la bitácora no guarda valores personales (una prueba lo confirma). | RN-09 y desvinculación del hash en la cadena; la eliminación es irreversible (grilling del 24/10).                                   |
| D14 | **Correo (HT-12, ADR-023)**: módulo `notificaciones` (`domain/correo.ts`, `application/ports/notificaciones.port.ts` y `cola-notificaciones.port.ts`, `infrastructure/smtp/nodemailer.adapter.ts`, `infrastructure/queue/notificaciones.processor.ts`, `plantillas/*.ts`). El API encola `{ plantilla, para, datos }` en la cola `notificaciones` (5 intentos, backoff exponencial desde 30 s, `removeOnComplete: true` y `removeOnFail` tras 7 días); el worker renderiza y envía (concurrencia 5). Variables solo del worker: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_PUBLIC_URL`. En desarrollo, Mailpit (`localhost:1025`); en producción, Brevo (HT-06).                                                                                                                                                                                                                                                | Criterios literales; ADR-006: el API no envía.                                                                                       |
| D15 | **Plantillas de correo**: funciones puras que devuelven `{ asunto, html, texto }`; layout común con el isologo (`${APP_PUBLIC_URL}/isologo-oasis.png`, servido desde `apps/web/public/`), lienzo arena, encabezado de noche, botón dorado con texto en tinta, tablas con estilos en línea, pie con el aviso legal y el contacto. Siempre con texto plano. Plantillas: `cuenta-creada` (D1), `pago-validado` y `pago-rechazado` (D16). Todos los valores se escapan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Identidad de Oasis en clientes de correo reales.                                                                                     |
| D16 | **HU-39**: `ValidarPagoUseCase` y `RechazarPagoUseCase` encolan el correo **después** del commit (como el anclaje), al `Cliente.email`: `pago-validado` (póliza, monto, fecha, código y botón «Verificar recibo» a `${APP_PUBLIC_URL}/recibos/verificar/<codigo>`) y `pago-rechazado` (póliza, monto, fecha y motivo). Si el cliente no tiene correo, no se encola y se registra `info`; si encolar falla, se registra `error` y la respuesta sigue siendo 200.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | El envío no retrasa ni rompe la operación.                                                                                           |
| D17 | **Anulación (HU-27)**: migración con `Recibo.motivoAnulacion`, `motivoHash`, `anuladoPorId`, `anuladoEn` y `anonimizadoEn` (D13); `EstadoPago` suma `ANULADO`; `AplicacionPago` suma `revertidaEn`. `POST /recibos/:id/anular` exige `{ confirmado: true, motivo }` (10 a 300 caracteres; la SPA advierte «no incluya datos personales»); solo ADMIN y solo ANCLADO (si no → 422 `RECIBO_NO_ANCLADO`). En una transacción: recibo ANULADO con motivo, autor y `motivoHash = keccak256(motivo)`; **pago ANULADO**; sus aplicaciones con `revertidaEn = now()` y las cuotas recuperan el valor (estado recalculado: PENDIENTE, PARCIAL o VENCIDA según fecha y lo pagado); el saldo vuelve a subir. Después del commit se encola `anular-recibo` con `motivoHash`.                                                                                                                                                                                          | Un pago validado por error no debe seguir descontando (grilling del 24/10); nada se borra (RN-05, RN-09).                            |
| D18 | La verificación de un recibo ANULADO por HU-27 sigue respondiendo ANULADO (S5 D2). `AnularReciboEnCadenaUseCase` usa el `motivoHash` guardado, no un hash fijo. El invariante de ADR-020 pasa a contar solo aplicaciones no revertidas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Coherencia con S5 y ADR-020.                                                                                                         |
| D19 | **Portal (HU-29)**: páginas `/portal` (inicio con héroe: lo urgente primero, cuota vencida o pago en validación), `/portal/polizas` y `/portal/polizas/:id` (saldo, cuotas, cobertura), `/portal/recibos` y `/portal/recibos/:id` (imprimible de S5), `/portal/cuenta` (cambiar contraseña y política aceptada con su fecha). Endpoints CLIENTE: `GET /mis-polizas/:id`, `GET /mis-pagos/:id`, `GET /mis-recibos` y `GET /mis-recibos/:id`; todos filtran por `usuario.clienteId` **en el `where`** (no después) y responden **404** para lo ajeno. La barra inferior (HT-13) enlaza estas páginas en lugar de las anclas de S4.                                                                                                                                                                                                                                                                                                                          | RNF-36; un 404 no revela existencia.                                                                                                 |
| D20 | **Dependencias** (T0): `apps/api` → `nodemailer`, `@types/nodemailer` (dev) y `xlsx` desde el CDN oficial de SheetJS (`"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"`); `apps/web` → ninguna.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Criterio de HU-34 (la versión de npm tiene vulnerabilidades conocidas).                                                              |
| D21 | **Pruebas:** TDD de dominio (anonimización, reversión de aplicaciones, validación de filas, normalización), guards, plantillas de correo (contenido, escape y texto plano) y casos de uso; e2e `cuentas-cliente`, `politica`, `importacion`, `solicitudes-titular`, `anulacion`, `portal-idor` y `notificaciones` (lee Mailpit por su API `GET /api/v1/messages`); Vitest de las páginas nuevas; Playwright `portal.spec.ts`, `importacion.spec.ts`, `anulacion.spec.ts` y `diseno.spec.ts` extendido. Solo Chromium.                                                                                                                                                                                                                                                                                                                                                                                                                                     | Evidencia por criterio (sección 12).                                                                                                 |
| D22 | **Punto de control visual** antes del único commit (T25): capturas a 1280 y 360 px de las pantallas nuevas y de los tres correos en Mailpit (HTML y texto).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Grilling del 24/10.                                                                                                                  |
| D23 | **Horas:** el informe reporta solo las horas de backlog por historia (sección 13).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Grilling del 24/10.                                                                                                                  |
| D24 | **Saldo antes de actuar** (de la Etapa C de S4 ([sprint-s4-etapa-c-plan.md](sprint-s4-etapa-c-plan.md))): con `saldo` en `polizaSchema` (D6), `FormularioPago` muestra «Saldo pendiente: $X» bajo la póliza elegida y la ayuda del monto pasa a «No puede superar $X»; `ValidarPagoDialog` suma «Saldo tras validar: $Y».                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | El operador ve el límite de RN-02 antes de escribir el monto.                                                                        |
| D25 | **Avance y mora explicados en el portal** (de la Etapa C de S4 ([sprint-s4-etapa-c-plan.md](sprint-s4-etapa-c-plan.md))): `GET /mis-polizas` y `GET /mis-polizas/:id` suman `proximaCuota: { numero, valor, fechaVencimiento } \| null` (primera no PAGADA que aún no vence) y `cuotaVencida: { numero, pendiente, fechaVencimiento } \| null` (la más antigua VENCIDA), calculadas en la misma consulta con las cuotas no PAGADAS (sin N+1). Cada póliza del portal muestra «Pagado $X de $Y» con una barra (`role="progressbar"`, `aria-valuenow` en porcentaje y el texto visible), «Próxima cuota: 15/12 · $120,00» y, si está en mora, «Venció la cuota 2 el 15/10 · faltan $120,00» en lugar del texto genérico de la Etapa C. El héroe de D19 usa `cuotaVencida` para «lo urgente primero».                                                                                                                                                        | El cliente entiende qué pagó, qué sigue y por qué está en mora sin llamar al bróker (PRODUCT.md, principio 4).                       |

## 3. Estado de partida (a confirmar en T0)

- **S5 entregó** (según su plan): verificación del CLIENTE con cinco resultados, imprimible,
  aplicación de pagos a cuotas con `FOR UPDATE`, cartera, cobertura y ramos de Oasis, y HT-16 con la
  política v1.0 en `docs/proteccion-datos/`. El informe `sprint-s5.md` dice qué quedó pendiente.
- **Usuarios:** `Usuario` tiene `clienteId @unique`, `politicaAceptadaEn` y `politicaVersion`;
  `rolPersonalSchema` excluye CLIENTE; HU-04 ya genera contraseñas temporales al crear y restablecer
  cuentas del personal.
- **Notificaciones:** `modules/notificaciones/` solo tiene `.gitkeep`; no hay cola `notificaciones`.
- **Auditoría:** la acción `IMPORTAR` existe en las constantes, sin ruta.
- **Recibos:** `AnularReciboUseCase` anula en cualquier estado y el job usa un hash fijo.
- **Portal:** `/mis-polizas`, `/mis-pagos` y `/mis-recibos/:id/imprimible` (S5) existen; no hay
  rutas de detalle del cliente. La barra inferior de S4 apunta a anclas del `PanelCliente`.
- **Mailpit:** no existe en `compose.dev.yaml` (S5 lo sacó de su alcance); lo agrega T6.

## 4. Fase 0 — Preparación (sesión principal)

### T0. Arrastre de S5, rama, dependencias, variables, isologo público y línea base

1. **Arrastre:** lee `docs/sprints/sprint-s5.md` y ejecuta primero lo no cerrado, con las tareas del
   plan de S5 y sus agentes. Si trae historias completas, detente e invoca `grilling`.
2. **Rama** `feat/sprint-s6-portal-importacion` desde `main` con S5 fusionado. Si `main` tiene cambios
   sin commit del desarrollador, detente y pregunta.
3. **Dependencias** de D20 (versiones exactas, anotadas en el ledger).
4. **Variables:** `.env.example` y `.env.worker.example` con `SMTP_HOST=localhost`, `SMTP_PORT=1025`,
   `SMTP_SECURE=false`, `SMTP_USER=`, `SMTP_PASS=`, `SMTP_FROM="Oasis Seguros <no-responder@oasis.local>"`
   y `APP_PUBLIC_URL=http://localhost:5173`.
5. **Isologo público:** copia `apps/web/src/assets/isologo-oasis.png` a `apps/web/public/` (D15).
6. **Línea base:** `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm -r typecheck`,
   `pnpm test`; totales en `.superpowers/sdd/sprint-s6-plan/principal.md`. Si algo está rojo,
   detente.
7. **Estado de partida:** confirma la sección 3 y anota diferencias.
8. **Recordatorio al autor** (sección 10): el VPS, el dominio, Brevo y Backblaze deben estar listos
   el 27/11.

## 5. Fase 1 — Contratos, documentación y Mailpit (en paralelo)

### T1. Cuentas, sesión y política (`contrato-shared`, HU-05, HU-33; TDD)

- **Archivos:** `schemas/usuario.schema.ts` o `cliente.schema.ts`, `schemas/auth.schema.ts`,
  `schemas/politica.schema.ts` (nuevo), `constants/estados.ts`, `constants/auditoria.ts`,
  `index.ts`.
- **Cambios:** `crearCuentaClienteSchema` (`{ email? }`); `cuentaClienteRespuestaSchema`
  (`{ usuario, contrasenaTemporal, correoEnviado }`); `ESTADOS_CUENTA = ['SIN_CUENTA',
'PENDIENTE_PRIMER_INGRESO', 'ACTIVA', 'DESACTIVADA']`; `POLITICA_DATOS_VERSION = '1.0'`;
  `aceptarPoliticaSchema`; `/auth/me` suma `debeCambiarContrasena` y `politicaPendiente`; acciones
  `ACEPTAR`, `RESOLVER` y `ANONIMIZAR` en `ACCIONES_AUDITORIA`.
- **Pruebas primero:** correo inválido → error; `aceptarPoliticaSchema` exige `version` no vacía.
- `components/estados.ts` (S4) ya tiene el dominio `cuenta`: `frontend-spa` lo alinea con
  `ESTADOS_CUENTA` en T16.

### T2. Saldo, ficha, portal y búsqueda (`contrato-shared`, HU-10, HU-15, HU-29; TDD)

- `saldo` en `polizaSchema`; `cuenta` en el detalle de cliente; `listarRecibosQuerySchema` con
  `clienteId`; esquemas de detalle del portal (`miPolizaDetalleSchema`, `miPagoDetalleSchema`,
  `miReciboSchema`); `normalizarBusqueda(texto)` en `validacion/`.
- `misPolizaSchema` = `polizaSchema` + `proximaCuota` y `cuotaVencida` (D25), usado por
  `/mis-polizas` y su detalle.
- **Pruebas primero:** `normalizarBusqueda('José Pérez ÑUÑO')` → `'jose perez nuno'`; espacios
  múltiples → uno; `null` o vacío → `''`.

### T3. Importación y solicitudes (`contrato-shared`, HU-34, HU-53; TDD)

- `TIPOS_IMPORTACION = ['CLIENTES', 'POLIZAS']` (HU-50 sumará `PAGOS_ASEGURADORA`);
  `filaClienteImportacionSchema` y `filaPolizaImportacionSchema` construidos **desde** los esquemas
  de creación (mismas reglas, RN-11 incluida) más el preprocesado de fechas y montos de D11;
  `vistaPreviaImportacionSchema`, `resumenImportacionSchema`.
- `TIPOS_SOLICITUD_TITULAR`, `ESTADOS_SOLICITUD_TITULAR`, `crearSolicitudTitularSchema`,
  `resolverSolicitudTitularSchema` (nota de 5 a 500).
- **Pruebas primero:** `'31/01/2026'`, `'2026-01-31'` y el número de serie de Excel `46053` → la
  misma fecha; `'1.234,50'` y `'1234.50'` → `'1234.50'`; cédula inválida → error con la columna;
  `numeroCuotas` ausente → 1; ramo por nombre «Vehículos» → aceptado.

**Ejemplo (orientativo):**

```ts
const fechaImportada = z.preprocess((v) => {
  if (typeof v === 'number') return serieExcelAISO(v);
  if (typeof v === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(v.trim()))
    return ddmmaaaaAISO(v.trim());
  return v;
}, fechaISOSchema);

export const filaPolizaImportacionSchema = crearPolizaSchema
  .omit({ clienteId: true, aseguradoraId: true, ramoId: true })
  .extend({
    identificacionCliente: z.string().trim().min(1),
    rucAseguradora: z.string().trim().length(13),
    ramo: z.string().trim().min(1),
    fechaInicio: fechaImportada,
    fechaFin: fechaImportada,
    primaTotal: montoImportado,
    numeroCuotas: z.coerce.number().int().min(1).max(24).default(1),
  });
```

### T4. Anulación y correo (`contrato-shared`, HU-27, HU-39, HT-12; TDD)

- `anularReciboSchema` (`confirmado: true`, motivo de 10 a 300); `ESTADOS_PAGO` suma `ANULADO`;
  `reciboDetalleSchema` suma `motivoAnulacion` y `anuladoEn`; `PLANTILLAS_CORREO = ['cuenta-creada',
'pago-validado', 'pago-rechazado']` con el tipo de sus datos (`DatosPlantilla<P>`).
- **Pruebas primero:** motivo de 9 caracteres → error; `confirmado: false` → error.
- `components/estados.ts` debe sumar `ANULADO` al dominio `pago`: `frontend-spa` lo hace en T19 (el
  `typecheck` lo exige).

### T5. Contraste de ADR (`documentacion`)

- ADR-022 (importación) y ADR-023 (correo) ya están redactadas y registradas. Se contrastan con D9
  a D11 y D14 a D16 y con lo que hayan revelado los Excel de Oasis; se ajustan solo si el plan las
  precisó (por ejemplo, la plantilla `cuenta-creada` de D1). ADR-020 suma, si hace falta, la
  reversión por anulación (D17, D18).

### T6. Mailpit (`infra`, HT-12)

- Servicio `mailpit` en `compose.dev.yaml` (`axllent/mailpit` con versión fija; SMTP en
  `127.0.0.1:1025`, interfaz en `127.0.0.1:8025`). `compose.prod.yaml` no lo incluye.
- **Verificación:** `docker.exe compose -f compose.dev.yaml up -d mailpit` y
  `curl http://localhost:8025/api/v1/messages` responde 200.

**Cierre de la Fase 1 (sesión principal):** `pnpm --filter @oasis/shared build` y `test`; borrar
`apps/web/node_modules/.vite`; Mailpit arriba; resumen para la Fase 2.

## 6. Fase 2 — API y worker (`backend-api`)

Una línea de trabajo, en orden: T7 → T15.

### T7. Migración y seed (`backend-api`)

- **Archivos:** `prisma/schema.prisma`, `prisma/migrations/<fecha>_portal_importacion_s6/`,
  `prisma/seed.ts`.
- **Esquema:** `Usuario.debeCambiarContrasena`; `AceptacionPolitica`; `Cliente.busqueda`;
  `Importacion`; `SolicitudTitular`; `Recibo.motivoAnulacion`, `motivoHash`, `anuladoPorId`
  (relación `ReciboAnuladoPor`), `anuladoEn` y `anonimizadoEn`; `EstadoPago` + `ANULADO`;
  `AplicacionPago.revertidaEn`. Índices `SolicitudTitular(estado, venceEn)` e
  `Importacion(usuarioId, creadoEn)`.
- **SQL a mano:** `CREATE EXTENSION IF NOT EXISTS unaccent;` y backfill
  `UPDATE "Cliente" SET busqueda = lower(unaccent(concat_ws(' ', nombres, apellidos, "razonSocial", identificacion, email)))`.
- **Seed:** el CLIENTE del seed con `politicaVersion = '1.0'` y `debeCambiarContrasena = false`, para
  no romper las e2e existentes; los CLIENTE nuevos se crean en las e2e.
- **Verificación:** `migrate dev` sobre la base de S5; `seed` dos veces; `migrate diff` sin deriva.

### T8. Notificaciones por correo (`backend-api`, HT-12; TDD)

- **Archivos:** módulo `modules/notificaciones/` completo (D14), `plantillas/layout.ts`,
  `plantillas/cuenta-creada.ts`, `pago-validado.ts`, `pago-rechazado.ts`, `config/env.schema.ts`
  (`validateWorkerEnv` con las variables SMTP), `infrastructure/queue/queue.module.ts` (cola
  `notificaciones`), `worker.module.ts` (`NotificacionesProcessor`).
- **Adaptador:** Nodemailer con `pool: true` y `verify()` al arrancar (log `warn` si falla, sin
  tumbar el worker).
- **Casos borde:** SMTP caído → reintento con backoff; en el último intento, log `error` con el
  destinatario enmascarado (`j***@dominio`), nunca la contraseña ni el cuerpo; plantilla
  desconocida → error de programación (falla la prueba de tipos).
- **Pruebas primero:** cada plantilla produce asunto, HTML y texto con sus datos; el HTML escapa los
  valores (un motivo con `<script>` sale como texto); el procesador reintenta ante error SMTP.

**Ejemplo (orientativo):**

```ts
export function pagoRechazado(d: DatosPlantilla<'pago-rechazado'>): Correo {
  return {
    asunto: `Su pago de la póliza ${d.numeroPoliza} fue rechazado`,
    html: layout({
      titulo: 'Pago rechazado',
      cuerpo: `<p>El pago de ${escapar(formatoMonto(d.monto))} del ${escapar(d.fecha)} no fue validado.</p>
               <p><strong>Motivo:</strong> ${escapar(d.motivo)}</p>`,
    }),
    texto: `Pago rechazado\nPóliza ${d.numeroPoliza}\nMonto ${formatoMonto(d.monto)}\nMotivo: ${d.motivo}`,
  };
}
```

### T9. Cuentas de cliente, cambio obligatorio y política (`backend-api`, HU-05, HU-33; TDD)

- **Archivos:** `CrearCuentaClienteUseCase` en el módulo que ya tiene el generador de contraseñas de
  HU-04 (el otro módulo se importa, como `PagosModule` → `RecibosModule`), `clientes.controller.ts`
  (`POST /clientes/:id/cuenta`), `common/auth/cambio-pendiente.guard.ts` y
  `politica-pendiente.guard.ts` (+specs), `common/auth/decorators.ts`, `app.module.ts` (`APP_GUARD`
  tras `RolesGuard`), `JwtEstrategia` y la emisión de tokens (claims `dc` y `pp`), módulo `politica`
  o `auth` (`POST /politica/aceptar`), `CambiarActivoClienteUseCase` (D3).
- **Comportamiento:** D1 a D4; el correo `cuenta-creada` se encola **después** del commit con el
  `ColaNotificacionesPort` de T8.
- **Pruebas primero:** crear cuenta → rol CLIENTE, `debeCambiarContrasena`, `correoEnviado: true` y
  job encolado; sin correo → `correoEnviado: false` y sin job; segunda cuenta → 409; correo usado →
  409; cliente inactivo → 422; con `dc` cualquier ruta salvo las permitidas → 403; tras cambiar la
  contraseña → 200; CLIENTE con versión vieja → 403 `POLITICA_PENDIENTE`; aceptar la vigente →
  historial y 200; aceptar otra → 422; desactivar el cliente cierra sus sesiones; reactivarlo
  reactiva la cuenta; la contraseña no aparece en la bitácora ni en los logs.

### T10. Saldo, ficha y búsqueda (`backend-api`, HU-10, HU-15; TDD)

- D6 en el repositorio de pólizas (`groupBy` y `aggregate`, también en `/mis-polizas`); D7 (`cuenta`
  en el detalle de cliente; `clienteId` en `GET /recibos`); D8 (normalización en crear y editar,
  búsqueda por `busqueda`).
- **Pruebas primero:** saldo tras validar 2 pagos; la página de 20 pólizas hace una sola consulta de
  saldos (espía del cliente Prisma o conteo de consultas); «jose perez» encuentra a «José Pérez»;
  editar el nombre actualiza `busqueda`.

### T11. Importación (`backend-api`, HU-34; TDD)

- **Archivos:** módulo `modules/importaciones/` (hexagonal): `domain/fila-cliente.ts` y
  `fila-poliza.ts` (validación por fila reutilizando los validadores de dominio de clientes y
  pólizas, no los controladores), `application/ports/` (`LectorHojasPort` con adaptador SheetJS,
  `AlmacenVistaPreviaPort` con adaptador Redis y el repositorio), casos de uso
  `VistaPreviaImportacionUseCase`, `ConfirmarImportacionUseCase` y `GenerarPlantillaUseCase`;
  controlador con las tres rutas de D9 a D11 (`@Roles('ADMIN', 'OPERADOR')`).
- **Pólizas importadas:** cada una con su plan de `numeroCuotas` (ADR-020) en la misma transacción
  del lote; el cliente se resuelve por identificación (existente o del archivo de clientes ya
  importado), la aseguradora por RUC y el ramo por código o nombre activo.
- **Seguridad:** el archivo solo vive en memoria; se rechaza un .xlsx con macros (`vbaProject.bin`)
  o sin la hoja esperada; los textos se recortan y se limitan con las longitudes del registro
  manual; nunca se evalúan fórmulas.
- **Pruebas primero:** CSV con 3 válidas y 2 inválidas → vista previa con errores por fila y
  columna; confirmar → 3 importadas, `Importacion` con el resumen y bitácora `IMPORTAR`; confirmar
  con otro usuario → 404; vista previa vencida → 404; 5 001 filas → 422; 5 MB + 1 byte → 413;
  identificación repetida dentro del mismo archivo → error en la segunda fila; identificación que ya
  existe en la base → «Ya existe»; una fila que se vuelve inválida entre la vista previa y la
  confirmación → pasa a errores.

### T12. Solicitudes del titular (`backend-api`, HU-53; TDD)

- **Archivos:** módulo `modules/titulares/` (hexagonal) con `RegistrarSolicitudUseCase`,
  `ListarSolicitudesUseCase`, `ResolverSolicitudUseCase`, `ExportarDatosTitularUseCase` y
  `AnonimizarClienteUseCase`; `VerificarReciboUseCase` responde NO_ENCONTRADO con `anonimizadoEn`.
- **Comportamiento:** D12 y D13; resolver una ELIMINACION exige ADMIN (OPERADOR → 403) y ejecuta la
  anonimización en la misma transacción que marca la solicitud RESUELTA.
- **Pruebas primero:** `venceEn` a 10 días calendario; `porVencer` con 2 días; exportación sin `sal`
  ni `payloadCanonico`; anonimización: el número de registros no cambia, los campos personales se
  reemplazan, las sesiones se cierran, los recibos quedan con `sal = ''` y la verificación responde
  NO_ENCONTRADO; la bitácora de la operación no contiene el nombre ni la identificación originales;
  OPERADOR que intenta resolver una ELIMINACION → 403.

### T13. Correos de validación y rechazo (`backend-api`, HU-39; TDD)

- D16 en `ValidarPagoUseCase` y `RechazarPagoUseCase`, con `ColaNotificacionesPort` inyectado.
- **Pruebas primero:** validar encola `pago-validado` con el código; rechazar encola
  `pago-rechazado` con el motivo; cliente sin correo → no encola y registra `info`; si la cola lanza,
  la respuesta igual es exitosa y hay log `error`.

### T14. Anulación (`backend-api`, HU-27; TDD)

- D17 y D18 en `AnularReciboUseCase`, el repositorio (transacción con reversión) y
  `AnularReciboEnCadenaUseCase`.
- **Pruebas primero:** anular un ANCLADO con motivo → recibo y pago ANULADOS, cuotas revertidas (una
  PAGADA vuelve a PENDIENTE o VENCIDA según la fecha), saldo recuperado y job con `motivoHash`; un
  PENDIENTE_ANCLAJE → 422 `RECIBO_NO_ANCLADO`; sin motivo → 400; OPERADOR → 403; el invariante de
  ADR-020 (con aplicaciones no revertidas) se cumple después de anular.

### T15. Portal y cierre del carril (`backend-api`, HU-29; TDD)

- Rutas de D19 con `MisPolizasController`, `MisPagosController` y `MisRecibosController`; cada
  consulta lleva `clienteId` en el `where`.
- `proximaCuota` y `cuotaVencida` (D25) en `/mis-polizas` y `/mis-polizas/:id`. Pruebas primero:
  una póliza con la cuota 1 pagada, la 2 vencida y la 3 por vencer devuelve la 2 como vencida y la 3
  como próxima; una póliza pagada por completo devuelve `null` en ambas.
- **Pruebas primero:** un CLIENTE pide el detalle de una póliza, un pago y un recibo de otro → 404 en
  los tres (spec de casos de uso; la e2e es T21).
- **Cierre:** `lint`, `typecheck`, `test`, `deps:check`; coberturas de `@Roles` y `@Auditar` con las
  rutas nuevas.

**Cierre de la Fase 2 (sesión principal):** `pnpm -r build`, `lint`, `format:check`, `typecheck`,
`deps:check`, `deps:check:negativo`, `pnpm test`; resumen de la API para `frontend-spa`.

## 7. Fase 3 — SPA (`frontend-spa`)

Una línea de trabajo, en orden: T16 → T20.

### T16. Cuentas y política (`frontend-spa`, HU-05, HU-33; TDD)

- **Archivos:** `features/clientes/components/CrearCuentaDialog.tsx` (+test),
  `features/auth/pages/CambiarContrasenaPage.tsx` (modo obligatorio),
  `features/politica/pages/PoliticaPage.tsx` y `PoliticaV1.tsx` (nuevos), `app/router.tsx`
  (`RutaProtegida` redirige según `debeCambiarContrasena` y `politicaPendiente`, primero la
  contraseña), `components/estados.ts` (dominio `cuenta` con `ESTADOS_CUENTA`).
- **Diálogo «Crear cuenta»:** muestra la contraseña temporal una vez, con botón «Copiar», aviso «No
  se volverá a mostrar» y el resultado del correo («Enviada a j…@dominio» o «El cliente no tiene
  correo: entréguela por otro medio»).
- **Política:** texto, casilla «He leído y acepto» y botón dorado «Aceptar y continuar».
- **Pruebas primero:** con `dc` cualquier ruta lleva a cambiar contraseña; con `pp`, a la política;
  aceptar envía la versión y vuelve al portal; el diálogo no muestra la contraseña tras cerrarse.

### T17. Ficha del cliente y saldo (`frontend-spa`, HU-10, HU-15; TDD)

- **Archivos:** `features/clientes/pages/ClienteDetallePage.tsx` (+test, nuevo), `router.tsx`,
  `ClientesPage.tsx` y demás tablas (nombre como enlace a la ficha), `PolizasPage.tsx`,
  `PolizaDetallePage.tsx` (saldo).
- **Ficha (D7):** contacto; cuenta (insignia y acción); pólizas (estado, saldo, mora); pagos
  (estado); recibos (enlace al detalle y al imprimible); solicitudes del titular.
- **Saldo:** cifra tabular en `PolizasPage` y en el portal; panel de noche en el detalle.
- **Saldo antes de actuar (D24):** en `FormularioPago` y `ValidarPagoDialog`. Pruebas primero: al
  elegir una póliza con saldo $518,40 aparece «Saldo pendiente: $518,40» y la ayuda del monto lo cita.
- **Pruebas primero:** la ficha muestra las seis secciones; el saldo cambia tras validar (mock que
  invalida la consulta); los enlaces de recibos llevan al detalle.

### T18. Importación (`frontend-spa`, HU-34; TDD)

- **Archivos:** `features/importaciones/pages/ImportarPage.tsx` (+test, nuevo),
  `features/importaciones/api.ts`, `router.tsx`, enlace en el riel o desde Clientes y Pólizas.
- **Asistente de 4 pasos:** tipo → plantilla → archivo → vista previa y confirmación → resumen. Zona
  de archivo de DESIGN.md (arena hundida, formato permitido, nombre elegido), validación local de
  tamaño y extensión, tabla de errores por fila con columna y mensaje, contador de válidas y botón
  dorado «Importar N filas válidas».
- **Pruebas primero:** un archivo de 6 MB da error local sin llamar al API; la vista previa lista los
  errores; confirmar muestra el resumen.

### T19. Solicitudes del titular y anulación (`frontend-spa`, HU-53, HU-27; TDD)

- **Archivos:** `features/titulares/pages/SolicitudesTitularPage.tsx` (+test, nuevo),
  `features/recibos/pages/ReciboDetallePage.tsx`, `features/recibos/components/AnularReciboDialog.tsx`
  (+test), `components/estados.ts` (`ANULADO` en el dominio `pago`).
- **Solicitudes:** listado con vencimiento (aviso si faltan ≤ 2 días, error si venció) y acciones por
  tipo: descargar la exportación, marcar resuelta con nota y, solo para ADMIN, anonimizar con doble
  confirmación roja que exige escribir la identificación.
- **Anulación:** «Anular recibo» (ADMIN, solo ANCLADO) con motivo y el aviso «no incluya datos
  personales»; el detalle muestra motivo y fecha de anulación.
- **Pruebas primero:** «Anonimizar» no se habilita hasta escribir la identificación exacta; el
  OPERADOR no ve «Anonimizar» ni «Anular».

### T20. Portal del cliente (`frontend-spa`, HU-29; TDD)

- **Archivos:** `features/portal/pages/*` (inicio, pólizas, detalle de póliza, recibos, cuenta),
  `router.tsx`, `components/layout/BarraInferiorCliente.tsx` (enlaces a las páginas nuevas).
- Con `frontend-design` sobre DESIGN.md: héroe del portal, una columna, cuerpo de 16 px, pie fijo con
  la acción del paso; estados con `EstadoInsignia`; saldo por póliza; recibos con estado y enlace al
  imprimible; en Cuenta, la política aceptada con su fecha.
- **Avance y mora (D25):** barra «Pagado $X de $Y», próxima cuota y la cuota vencida con su fecha;
  `SeguimientoPago` (Etapa C) en el detalle del pago. Pruebas primero: la barra expone su porcentaje
  a lectores de pantalla; una póliza en mora muestra el número y la fecha de la cuota vencida.
- **Pruebas primero:** el inicio prioriza la cuota vencida sobre el resto; cada pestaña de la barra
  inferior lleva a su página; un 404 del API muestra «No encontrado» sin datos.

**Cierre de la Fase 3 (sesión principal):** `pnpm --filter @oasis/web lint`, `typecheck`, `test` y
`build`; `pnpm format:check`.

## 8. Fase 4 — Evidencia y revisión

Infraestructura arriba (`compose.dev.yaml` con Mailpit, nodo Hardhat, `pnpm dev:chain`,
`migrate deploy`, `seed`). Antes de las e2e del API, detén el worker de desarrollo y limpia
`bull:anclaje-recibos:*` y `bull:notificaciones:*`.

### T21. e2e del API (`verificador`)

- **`cuentas-cliente.e2e-spec.ts`:** HU-05 y D2 (primer ingreso forzado; correo `cuenta-creada` en
  Mailpit; sin correo → `correoEnviado: false`); D3 (desactivar y reactivar).
- **`politica.e2e-spec.ts`:** HU-33, incluida la nueva aceptación al subir la versión (override de la
  constante en la prueba).
- **`importacion.e2e-spec.ts`:** HU-34 con archivos de `test/fixtures/` (.xlsx y .csv): plantillas,
  vista previa, confirmación, límites (413 y 422) y «Ya existe».
- **`solicitudes-titular.e2e-spec.ts`:** HU-53 completa, con la verificación NO_ENCONTRADO tras
  anonimizar.
- **`anulacion.e2e-spec.ts`:** HU-27 hasta el contrato (`verificar()` devuelve anulado con el
  `motivoHash`) y saldo recuperado.
- **`portal-idor.e2e-spec.ts`:** un CLIENTE pide `/mis-polizas/:id`, `/mis-pagos/:id`,
  `/mis-recibos/:id` y el imprimible de otro cliente → 404 en todos.
- **`notificaciones.e2e-spec.ts`:** validar y rechazar → dos correos con el enlace y el motivo; la
  respuesta llega antes que el correo (marca de tiempo de la respuesta < `Created` del mensaje).
- `acceso-por-rol.e2e-spec.ts` con la matriz nueva.

### T22. Playwright (`verificador`)

- **`portal.spec.ts`:** primer ingreso de un cliente nuevo (contraseña → política → inicio), pólizas
  con saldo y recibo imprimible.
- **`importacion.spec.ts`:** plantilla → archivo con errores → confirmación → resumen; luego la
  búsqueda sin tildes encuentra a un importado.
- **`anulacion.spec.ts`:** el ADMIN anula y la verificación muestra «Anulado».
- **`diseno.spec.ts`:** suma la ficha, la importación, las solicitudes, la política y el portal.

### T23. Revisión (`revisor` y dueños)

- Contra la sección 2, los criterios, `AGENTS.md`, `ponytail-review`, `accessibility` e
  `impeccable audit`. Atención: rutas exactas permitidas por los guards de cambio y política;
  `clienteId` en el `where` de todo el portal; anonimización completa y bitácora sin datos
  personales; la contraseña temporal fuera de logs, bitácora y jobs retenidos; archivos de
  importación solo en memoria y con límites; escape en las plantillas; envío después del commit;
  reversión de aplicaciones en la misma transacción.
- Una ronda de confirmación como máximo; después se repiten los cierres de las Fases 2, 3 y 4.

## 9. Fase 5 — Cierre

### T24. Definición de Terminado (sesión principal)

```bash
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test
docker.exe compose -f compose.dev.yaml up -d          # incluye Mailpit
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # portal_importacion_s6
pnpm --filter @oasis/api seed
pnpm test:e2e
pnpm --filter @oasis/web test:e2e
```

Pruebas manuales (resultado en el informe): importar el Excel real de Oasis (si llegó) en la base de
desarrollo y anotar los ajustes de columnas; abrir los tres correos en Mailpit en vista móvil y de
texto plano; lector de pantalla en la política y en el asistente de importación.

### T25. Capturas y punto de control (sesión principal)

1. Script de Playwright temporal en `.superpowers/sdd/sprint-s6-plan/` (no se versiona), a 1280 y
   360 px: ficha del cliente, diálogo de crear cuenta, cambio obligatorio, política, los cuatro pasos
   de la importación, solicitudes del titular (con una por vencer y una vencida), diálogo de anular y
   detalle anulado, y las cinco páginas del portal. Además, los tres correos abiertos en la interfaz
   de Mailpit (HTML y texto). En `capturas/`.
2. **Punto de control (D22):** presenta las capturas (rutas absolutas) y el resultado de T24. Espera
   «aprobado» o ajustes.

### T26. Documentación (`documentacion`)

- **`CLAUDE.md`:** guards de cambio y política (con su orden), cuentas de cliente y correo
  `cuenta-creada`, búsqueda normalizada, importación (ADR-022), solicitudes del titular y
  anonimización, correo (ADR-023), anulación con reversión, portal y la regla de `clienteId` en el
  `where`.
- **`docs/despliegue.md`:** variables SMTP y `APP_PUBLIC_URL`; Mailpit en desarrollo.
- **`apps/api/src/modules/README.md`:** módulos `importaciones`, `notificaciones` y `titulares`;
  acciones nuevas.
- **ADR:** ajustes que T5 o la ejecución hayan dejado pendientes.
- **`docs/sprints/README.md`:** fila de S6.

### T27. Informe y commit (sesión principal)

`docs/sprints/sprint-s6.md` con la estructura de `sprint-s4.md`: criterios con evidencia (sección
12), DoD, decisiones y discrepancias (contraseña temporal por correo, reversión del pago al anular,
eliminación solo para ADMIN, días calendario), **horas de backlog** (sección 13), deuda con sprint
destino, acciones del autor y «Cómo verificar». Revisa con `git status` que no entren `.env`,
`.superpowers/`, `.agents/`, `.claude/` ni `*.docx`. Solo con el «aprobado» de T25:

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint S6 con portal del cliente, importación y notificaciones

- HU-05, HU-33: cuentas de cliente con contraseña temporal obligatoria y aceptación de la política.
- HU-10, HU-15: ficha del cliente y saldo pendiente en pólizas y portal.
- HU-34: importación de clientes y pólizas con vista previa y SheetJS 0.20.3 desde su CDN.
- HU-53: solicitudes del titular con exportación y anonimización sin borrar registros.
- HT-12, HU-39: correo desde la cola del worker al crear cuentas y al validar o rechazar pagos.
- HU-27: anulación de recibos anclados con motivo, reversión del pago y anular() en el contrato.
- HU-29: portal del cliente con pólizas, pagos y recibos propios (404 para lo ajeno).
- Deuda: búsqueda sin tildes y cuenta del cliente al desactivarlo.

Refs: HU-05, HU-10, HU-15, HU-33, HU-34, HU-53, HT-12, HU-27, HU-29, HU-39
EOF
```

Sin push. Mensaje final: resumen de la verificación, acciones del autor (en especial el VPS y el
dominio), título y cuerpo del PR.

## 10. Acciones del autor e hitos

- **Hasta el 27/11:** contratar el VPS (OVHcloud VPS-1, tabla 8-1 de la arquitectura), el dominio o
  subdominio y su registro DNS A; cuenta de Brevo (dominio remitente verificado con SPF y DKIM) y
  cuenta de Backblaze B2 con un bucket privado. Sin esto, S7 queda bloqueado (R1).
- Confirmar con Oasis la política v1.0 (si cambia, se publica como 1.1 y los clientes la aceptan de
  nuevo).
- Aprobar el punto de control, push, PR y aceptación del Product Owner.

## 11. Riesgos

| #   | Riesgo                                          | Respuesta                                                                                                               |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| R1  | VPS o dominio no contratados el 27/11           | S7 empieza por HU-50, HU-31 y HU-17 (sin servidor) y HT-05 en local; HT-06 se mueve al final de S7.                     |
| R2  | Los Excel de Oasis traen columnas muy distintas | Alias de encabezados (D11); si hace falta transformar datos, se documenta un paso manual.                               |
| R3  | Sprint cargado (10 historias)                   | Si el 26/11 no cierra, ceden en este orden a S7: la parte visual de solicitudes del titular (el API ya cumple) y HU-39. |
| R4  | Correos marcados como spam en producción        | Brevo con SPF y DKIM (acción del autor); la prueba real se hace en HT-06 (S7).                                          |

## 12. Trazabilidad criterio → evidencia

| Criterio                                  | Evidencia esperada                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| HU-05.1 una cuenta vinculada a un cliente | `cuentas-cliente.e2e-spec.ts`; spec de `CrearCuentaClienteUseCase`                                     |
| HU-05.2 rol CLIENTE                       | `cuentas-cliente.e2e-spec.ts`                                                                          |
| HU-05.3 cambio en el primer ingreso       | `cambio-pendiente.guard.spec.ts`; `cuentas-cliente.e2e-spec.ts`; `portal.spec.ts`                      |
| HU-05.4 una sola cuenta por cliente       | `cuentas-cliente.e2e-spec.ts` (409)                                                                    |
| HU-10.1–HU-10.2                           | `ClienteDetallePage.test.tsx`; e2e de `GET /recibos?clienteId`                                         |
| HU-15.1–HU-15.3                           | spec del repositorio de pólizas; `polizas.e2e-spec.ts`; `PolizaDetallePage.test.tsx`; `portal.spec.ts` |
| HU-33.1–HU-33.3                           | `politica.e2e-spec.ts`; `PoliticaPage.test.tsx`; `portal.spec.ts`                                      |
| HU-34.1 plantilla .xlsx o CSV             | `importacion.e2e-spec.ts` (descarga de ambas)                                                          |
| HU-34.2 reglas del registro manual        | `fila-*.spec.ts`; `importacion.e2e-spec.ts`                                                            |
| HU-34.3 vista previa con errores          | `importacion.e2e-spec.ts`; `ImportarPage.test.tsx`                                                     |
| HU-34.4 solo válidas y resumen            | `importacion.e2e-spec.ts`; `importacion.spec.ts`                                                       |
| HU-34.5 cobertura y condiciones           | plantilla de pólizas; `importacion.e2e-spec.ts`                                                        |
| HU-34.6 5 MB, 5 000 filas, SheetJS CDN    | `importacion.e2e-spec.ts` (413 y 422); `apps/api/package.json`                                         |
| HU-53.1–HU-53.4                           | `solicitudes-titular.e2e-spec.ts`; `SolicitudesTitularPage.test.tsx`                                   |
| HT-12.1–HT-12.4                           | `nodemailer.adapter.spec.ts`; `notificaciones.processor.spec.ts`; plantillas; `env.schema.spec.ts`     |
| HU-27.1–HU-27.4                           | `anulacion.e2e-spec.ts`; specs de anulación; `anulacion.spec.ts`                                       |
| HU-29.1–HU-29.5                           | `portal-idor.e2e-spec.ts`; `portal.spec.ts`; páginas del portal                                        |
| HU-39.1–HU-39.3                           | `notificaciones.e2e-spec.ts`; specs de los casos de uso                                                |

## 13. Horas de backlog

| Historia  |  Horas |
| --------- | -----: |
| HU-05     |      4 |
| HU-10     |      4 |
| HU-15     |      4 |
| HU-33     |      3 |
| HU-34     |      9 |
| HU-53     |      4 |
| HT-12     |      6 |
| HU-27     |      8 |
| HU-29     |      9 |
| HU-39     |      3 |
| **Total** | **54** |

## 14. Prompt de arranque

```text
Eres la sesión principal del Sprint S6 del SRPP. Ejecuta docs/sprints/sprint-s6-plan.md de
principio a fin con subagent-driven-development, siguiendo sus reglas (sección 0) y sus decisiones
(sección 2), que no se reabren.

1. Lee AGENTS.md, CLAUDE.md, apps/api/src/modules/README.md y el plan completo. Invoca
   subagent-driven-development y ponytail. Abre el ledger en .superpowers/sdd/sprint-s6-plan/.
2. Fase 0 (T0): arrastre de S5, rama, dependencias, variables, isologo público, línea base y estado
   de partida. Si el arrastre trae historias completas, detente e invoca grilling.
3. Fase 1: en un mismo mensaje, @contrato-shared con T1–T4, @documentacion con T5 e @infra con T6.
   Cierra la fase.
4. Fase 2: @backend-api con T7–T15, en orden. Cierra la fase y prepara el resumen de la API.
5. Fase 3: @frontend-spa con T16–T20, con ese resumen. Cierra la fase.
6. Fase 4: @verificador con T21 y T22 (bugs de producto → relanza al dueño con la prueba roja);
   @revisor con T23; máximo una ronda de confirmación.
7. Fase 5: T24 DoD; T25 capturas y DETENTE en el punto de control; con mi «aprobado»,
   @documentacion con T26 y tú T27 (informe y único commit, sin atribuciones y sin push).

Cada agente recibe un mensaje autosuficiente: sus tareas, las decisiones por número, lo que
entregaron los demás y la ruta de su nota. Respeta las fronteras de la tabla 0.1. Termina con el
resumen, el cuerpo del PR y el recordatorio de las acciones del autor de la sección 10.
```
