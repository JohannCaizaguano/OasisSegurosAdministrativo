# Sprint S2 — Plan de implementación

- **Historias:** HU-01 Iniciar sesión (8 h), HU-02 Cerrar sesión (3 h), HU-03 Control de acceso por
  rol (6 h), HU-06 Cambiar contraseña (3 h), HU-32 Cierre de sesión por inactividad (2 h), HT-04
  Base del frontend con shadcn/ui (10 h), HU-04 Gestionar usuarios del personal (5 h), HU-07
  Registrar cliente (6 h) y HU-11 Registrar aseguradora (4 h).
- **Horas:** 47 de 50 h de capacidad (tabla 6-1 del backlog).
- **Épicas:** EP-01 (HU-01, HU-02, HU-03, HU-04, HU-06, HU-32), EP-07 (HT-04), EP-02 (HU-07) y
  EP-03 (HU-11).
- **Fechas:** 21/09/2026 – 02/10/2026 (tabla 6-1 del backlog).
- **Dos etapas secuenciales:**
  - **Etapa A — Acceso, sesiones y cambio de contraseña (HU-01, HU-02, HU-03, HU-06, HU-32):**
    termina con el **commit 1**.
  - **Etapa B — Base de la SPA, usuarios del personal, clientes y aseguradoras (HT-04, HU-04,
    HU-07, HU-11):** parte de la Etapa A integrada y suma sus dos pendientes (cierre de sesiones al
    desactivar y desborde a 360 px); termina con el **commit 2**.
- **Ramas:** una por etapa, cada una con su commit y su PR: `feat/sprint-03-acceso-sesiones` (Etapa
  A) y `feat/sprint-04-personal-clientes-aseguradoras` (Etapa B).
- **Ejecuta:** agente local (OpenCode) sobre esta copia del repositorio.
- **Decisiones acordadas con el desarrollador:** 06/10/2026, para las dos etapas (secciones A2 y
  B2).

Este documento es el Sprint Backlog de S2. Las reglas generales están en `AGENTS.md`, el mapa técnico
en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`. OpenCode
solo carga `AGENTS.md`: lee los otros dos antes de empezar. La fuente de verdad está en
`docs/referencia/`, que no se edita. Si algo de este plan contradice `docs/referencia/`, gana la
referencia: detente y repórtalo. El informe del sprint es `docs/sprints/sprint-s2.md`.

**Cómo leer las tareas.** Cada tarea trae un **miniprompt** (qué hacer, archivos, comportamiento,
casos borde, restricciones, pruebas primero, skills y verificación) y, cuando ayuda, un bloque
**Ejemplo (orientativo)**. El ejemplo muestra la forma o la parte delicada; no se copia tal cual:
adáptalo al código real con tu criterio y con las skills de la fase. Las decisiones (D1 a D48) y las
tareas (T0 a T39) se numeran de forma continua en las dos etapas.

---

# ETAPA A — Acceso, sesiones y cambio de contraseña (HU-01, HU-02, HU-03, HU-06, HU-32)

## A0. Reglas de ejecución

1. Ejecuta las fases en orden: A0 → A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8.
2. TDD en toda lógica nueva: primero la prueba en rojo y luego el código (`test-driven-development`).
   Antes de cerrar una fase usa `verification-before-completion` y guarda la salida para el informe.
3. Al empezar cada fase, invoca las skills de su fila en la tabla de la sección A0.1, en el orden de
   `AGENTS.md`: skill de proceso → skill de la tecnología → ponytail decide el tamaño.
4. Tras cambiar `packages/shared/src`, ejecuta `pnpm --filter @oasis/shared build` para que el API y
   la SPA vean el cambio, y borra `apps/web/node_modules/.vite`: Vite no invalida el prebundle de un
   paquete del workspace cuando cambia su `dist` (informe de S1, §8).
5. El árbol de trabajo ya trae la actualización de alcance del 06/10 (sección A3). **No la descartes
   ni la guardes con `stash`**: entra en el commit del sprint. Nunca edites `docs/referencia/`.
6. **Un solo commit** al final (sección A13). **No hagas push ni abras el PR**: los hace el usuario.
7. No adelantes trabajo de otros sprints; lo que quede fuera de alcance se anota como deuda en el
   informe (sección A12.2).
8. Comentarios solo para el porqué no obvio y en español (`AGENTS.md`). Las simplificaciones
   deliberadas llevan un comentario `ponytail:` con el techo y la salida.

### A0.1 Skills por fase

| Momento                               | Skills                                                                                                                   | Para qué                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Todo el sprint                        | `executing-plans`, `ponytail`                                                                                            | Seguir el plan fase por fase con el diff más corto que funcione.                    |
| Toda lógica nueva                     | `test-driven-development`                                                                                                | Prueba en rojo antes del código.                                                    |
| Un fallo o una prueba roja inesperada | `systematic-debugging`                                                                                                   | Causa raíz antes de cambiar código.                                                 |
| Cierre de cada fase                   | `verification-before-completion`                                                                                         | Evidencia (salida de los comandos) antes de declarar la fase terminada.             |
| Fase A1 (T1)                          | `zod`, `typescript-advanced-types`                                                                                       | Esquemas compartidos con `refine` y tipos inferidos.                                |
| Fase A2 (T2 a T7)                     | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`                                              | Estrategia JWT, guards, interceptores, Redis y async.                               |
| Fase A3, API (T8 a T11)               | `nestjs-best-practices`, `typescript-advanced-types`                                                                     | Guard por defecto, descubrimiento de rutas por metadata, controlador y caso de uso. |
| Fase A3, SPA (T12)                    | `react-best-practices`, `shadcn`, `tailwind-v4-shadcn`, `tailwind-css-patterns`, `impeccable`, `accessibility`, `vitest` | Rutas, menú por rol, página de verificación, tarjeta del QR y sus pruebas.          |
| Fase A4, API (T14)                    | `nestjs-best-practices`, `prisma-client-api`, `zod`                                                                      | Caso de uso, repositorio y endpoint del cambio de contraseña.                       |
| Fase A4, SPA (T15)                    | `react-hook-form`, `zod`, `react-best-practices`, `shadcn`, `impeccable`, `frontend-design`, `accessibility`, `vitest`   | Página `/cuenta/contrasena` y sus pruebas.                                          |
| Fase A5 (T16 y T17)                   | `react-best-practices`, `shadcn`, `impeccable`, `frontend-design`, `accessibility`, `vitest`                             | Store, api-client, hook de inactividad, aviso y aviso del login.                    |
| Fase A6, API (T18 y T19)              | `nestjs-best-practices`, `prisma-client-api`                                                                             | e2e con Supertest y datos de prueba creados con Prisma.                             |
| Fase A6, SPA (T20)                    | `playwright-best-practices`                                                                                              | `page.clock`, cabeceras por prueba y navegación atrás.                              |
| Fase A8 (cierre)                      | `ponytail-review`, `verification-before-completion`                                                                      | Revisar el diff completo y ejecutar la Definición de Terminado.                     |
| Si Vite sirve un prebundle viejo      | `vite`                                                                                                                   | Caché de `optimizeDeps` tras recompilar `@oasis/shared`.                            |

No aplican: `brainstorming` y `writing-plans` (el diseño y el plan ya están acordados), `prisma-cli`
(no hay migraciones), `bash-defensive-patterns` (no hay scripts bash nuevos) y `seo`. T13 (k6) y la
Fase A7 (documentación) siguen las reglas de `AGENTS.md` sin skill propia.

**`impeccable` en este sprint:**

- Es refinamiento de una SPA existente: conserva la identidad visual (componentes shadcn y tokens de
  `index.css`) y no rediseñes otras pantallas.
- Ejecuta `.agents/skills/impeccable/scripts/impeccable context --target <archivo>` una vez por
  sesión. No existen `PRODUCT.md` ni `DESIGN.md`: no ejecutes `init` ni `document`, porque
  crearían documentos que nadie pidió (`AGENTS.md`).
- Usa `harden` en `CambiarContrasenaPage` (errores y estados), y `audit` y `polish` sobre la página
  de contraseña, `AvisoInactividad`, el aviso del login y `VerificacionPage` (accesibilidad y 360 px).
- Haz una ronda de revisión y como máximo una de confirmación.

**Superpowers en este sprint:**

- `executing-plans` pide un espacio aislado, pero **no crees un worktree**: la actualización de
  alcance sin commitear solo existe en esta copia. Trabaja en la rama de T0.
- Su ledger vive en `.superpowers/sdd/sprint-s2-plan/`, que ya está en `.gitignore`.
- Sin commits por tarea: el único commit es el de la sección A13.
- Las decisiones de la sección A2 no se reabren con un "ruling". Si una deja de ser viable, detente y
  pregunta; los demás desvíos menores van al ledger y al informe como discrepancias.
- Al terminar, si `finishing-a-development-branch` ofrece opciones, elige "conservar la rama tal
  cual": sin merge, push ni PR.

## A1. Alcance

### HU-01 — Iniciar sesión (RF-01, RF-03, RNF-09, RNF-12)

1. Con credenciales válidas se emite un token de acceso y una cookie de renovación httpOnly.
2. Con credenciales inválidas se muestra un mensaje genérico que no revela qué dato falló.
3. El sexto intento en un minuto desde la misma IP devuelve 429.
4. La sesión se renueva automáticamente mientras el token de renovación sea válido.
5. Las contraseñas se almacenan con argon2.

### HU-02 — Cerrar sesión (RF-02)

1. El token de renovación queda invalidado en el servidor.
2. La cookie de sesión se elimina y se redirige al inicio de sesión.
3. Volver atrás en el navegador no muestra datos protegidos.

### HU-03 — Control de acceso por rol (RF-04, RN-07)

1. Cada endpoint declara los roles permitidos y un acceso no autorizado devuelve 403.
2. El menú muestra solo las opciones del rol del usuario.
3. Un usuario CLIENTE solo obtiene sus propias pólizas, pagos y recibos.

Incluye la regla de acceso de ADR-015 (D4 y D5): no queda ningún endpoint público de negocio.

### HU-06 — Cambiar contraseña (RF-07)

1. Se exige la contraseña actual.
2. La nueva contraseña tiene al menos 8 caracteres.
3. Al cambiarla se cierran las demás sesiones.

### HU-32 — Cierre de sesión por inactividad (RF-37)

1. La sesión se cierra tras 30 minutos sin actividad.
2. Un minuto antes se muestra un aviso con opción de continuar.
3. Al cerrarse, se redirige al inicio de sesión.

### Fuera de alcance (no implementar)

- Verificación del CLIENTE sobre sus recibos (RN-07, "No encontrado" si es ajeno), límite de 30
  consultas por minuto por usuario (RNF-12) y presentación de resultados de HU-28 (S5).
- Recuperación de contraseña (HU-31, S7): figura en la lista de rutas públicas de ADR-015, pero aún
  no existe.
- Gestión de usuarios y cierre de sesiones al desactivar una cuenta (HU-04, Etapa B); cambio obligatorio
  de la contraseña temporal (HU-05, S6).
- `TransaccionPagoLinea` y pago en línea (HU-48, retirada en el backlog v1.5).
- Desborde a 360 px de `/`, `/pagos` y `/recibos` (HT-04, Etapa B).
- Firefox y WebKit en Playwright (HT-09, S8).

## A2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Motivo                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Plan con el formato de la Etapa B de S1, ejecutado por OpenCode; un solo commit; push y PR los hace el usuario.                                                                                                                                                                                                                                                                                                                                                                                                                                 | `AGENTS.md` y preferencia del usuario. OpenCode trae superpowers, ponytail e `impeccable`.                                                        |
| D2  | El commit incluye la actualización de alcance del 06/10 que está sin commitear (backlog v1.1, arquitectura v1.3, ADR-014, ADR-015, `AGENTS.md`, `CLAUDE.md`, `README.md`, ADR y fichas modificadas).                                                                                                                                                                                                                                                                                                                                            | Decisión del desarrollador.                                                                                                                       |
| D3  | El plan usa las fechas del backlog (21–25/09/2026).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Decisión del desarrollador.                                                                                                                       |
| D4  | Regla de acceso de ADR-015 en S2: se retira `VerificacionPublicaController`; la verificación pasa a `GET /api/v1/recibos/:codigo/verificacion`, solo para ADMIN y OPERADOR; la SPA la sirve en `/recibos/verificar` y `/recibos/verificar/:codigo`, protegidas, y el QR apunta ahí. El CLIENTE y el límite por usuario llegan en S8.                                                                                                                                                                                                            | HU-03 (criterio 1) sin excepciones y una sola regla de acceso desde ahora; solo se adelanta, para el personal, el criterio 1 de HU-28.            |
| D5  | Sin JWT quedan solo `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /health` y `GET /metrics`. Se enmienda ADR-015 para listarlas.                                                                                                                                                                                                                                                                                                                                                                                          | El logout se autentica con la cookie: con JWT, un access token vencido impediría revocar la sesión. `/metrics` es infraestructura (ADR-009).      |
| D6  | Sesiones por familia: llave `sesion:<usuarioId>:<sid>` en Redis con el `jti` vigente y TTL de `TTL_SESION_SEGUNDOS` (1 860 s). Ambos tokens llevan el `sid`. `JwtEstrategia` hace `EXPIRE` en cada petición: comprueba y desliza la sesión en una sola operación (ADR-016).                                                                                                                                                                                                                                                                     | Corrige el defecto de un `jti` por usuario y hace demostrables HU-02, HU-06 y HU-32 (la revocación surte efecto al instante).                     |
| D7  | Un `jti` que no es el vigente revoca solo esa familia. Una sesión ya expirada o un JWT vencido responden 401 sin revocar nada.                                                                                                                                                                                                                                                                                                                                                                                                                  | OAuth 2.0 Security BCP: un token robado no tumba las sesiones de otros equipos.                                                                   |
| D8  | Vencimiento absoluto de `JWT_REFRESH_TTL` (7 días) desde el inicio de sesión: la rotación conserva el `exp` de la familia y la cookie vence con él.                                                                                                                                                                                                                                                                                                                                                                                             | ARQUITECTURA §10.2 ("token de renovación de 7 días"); acota un token robado que se refresca solo.                                                 |
| D9  | Si Redis no responde en 2 s, la comprobación de sesión falla cerrada con 502 (`ErrorDependenciaExterna`). Se reutiliza el tiempo límite de los indicadores de salud, movido a `shared-kernel/`.                                                                                                                                                                                                                                                                                                                                                 | Con `maxRetriesPerRequest: null` un comando con Redis caído queda encolado sin fin (S1, §8): cada petición quedaría colgada.                      |
| D10 | La SPA serializa el refresco entre pestañas con Web Locks (`oasis-refresco`); sin `navigator.locks`, sigue como hoy.                                                                                                                                                                                                                                                                                                                                                                                                                            | Dos pestañas que refrescan a la vez (p. ej., al restaurar el navegador) dispararían la detección de reutilización.                                |
| D11 | `RolesGuard` niega por defecto: autenticado sin `@Roles` ni `@Public` → 403.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | HU-03 (criterio 1): una ruta nueva nunca queda abierta a cualquier autenticado.                                                                   |
| D12 | `apps/api/test/rutas-declaradas.ts` descubre las rutas desde el grafo de módulos de `AppModule`. Lo usan: la prueba unitaria de cobertura de roles (públicas exactamente las de D5), la de `@Auditar` (pierde su lista manual) y un e2e que espera 401 sin token y 403 por rol no permitido en cada ruta.                                                                                                                                                                                                                                       | Evidencia sobre todas las rutas actuales y futuras sin listas que mantener.                                                                       |
| D13 | La regla RN-07 de `mis-pagos` pasa a `ListarPagosDeClienteUseCase`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Igual que `mis-polizas`; las reglas no viven solo en el controlador (ERS §4).                                                                     |
| D14 | HU-06: `POST /api/v1/auth/cambiar-contrasena` en el módulo auth, para los 3 roles, con `@Auditar('MODIFICAR', 'Usuario')` y el límite de `THROTTLE_LOGIN_LIMIT` por minuto. `contrasenaSchema` de 8 a 128 caracteres y la nueva distinta de la actual. Contraseña actual incorrecta → 400 `VALIDACION` con `details` en `actual`; responde 204.                                                                                                                                                                                                 | Nunca 401: la SPA lo trataría como sesión vencida. El límite evita adivinar la contraseña con un token robado. 128 acota el costo de argon2.      |
| D15 | El cambio de contraseña mantiene la sesión actual y cierra las demás al instante (`cerrarDemas`).                                                                                                                                                                                                                                                                                                                                                                                                                                               | HU-06 (criterio 3) demostrable con dos navegadores.                                                                                               |
| D16 | El interceptor de auditoría usa al propio usuario como `entidadId` cuando la entidad es `Usuario` y la ruta no trae id explícito.                                                                                                                                                                                                                                                                                                                                                                                                               | Sin eso el cambio de contraseña quedaría con `entidadId = null`; el login ya se registra así.                                                     |
| D17 | Página `/cuenta/contrasena`, enlazada desde el menú del usuario (no desde la barra lateral), con confirmación de la nueva contraseña.                                                                                                                                                                                                                                                                                                                                                                                                           | La cuenta no es una función de negocio; la regla de páginas se ajusta en `AGENTS.md` (T22).                                                       |
| D18 | HU-32: actividad = interacción en pantalla (`pointerdown`, `pointermove`, `keydown`, `wheel`, `touchstart`, `scroll`) en cualquier pestaña; las consultas automáticas no cuentan. Última actividad en `localStorage` (`oasis:ultima-actividad`); un cierre se propaga con `oasis:sesion-cerrada`. Latido `GET /auth/me` como máximo una vez por minuto si hay actividad y no hubo otra petición. Aviso a los 29 min y cierre a los 30 (la SPA llama a logout); TTL del servidor 31 min. Constantes en `@oasis/shared`, sin variable de entorno. | Las pestañas comparten sesión; el latido evita que el servidor cierre a quien escribe sin enviar nada; el TTL cubre la pestaña cerrada sin salir. |
| D19 | Aviso: `alertdialog` con cuenta regresiva (se anuncia al abrir, no cada segundo), "Continuar" con el foco y "Cerrar sesión"; aparece en todas las pestañas. Con el aviso abierto solo "Continuar" cuenta como actividad. El login muestra un aviso fijo: "Su sesión se cerró por inactividad." o, si la cerró el servidor, "Su sesión se cerró. Inicie sesión de nuevo." Al reingresar se vuelve a la página anterior.                                                                                                                          | Quien vuelve a un equipo compartido ve por qué se cerró.                                                                                          |
| D20 | `Cache-Control: no-store` en todas las respuestas del API con un interceptor global en `AppModule`.                                                                                                                                                                                                                                                                                                                                                                                                                                             | HU-02 (criterio 3); al estar en `AppModule`, los e2e lo heredan.                                                                                  |
| D21 | El 429 responde en español con el `errorMessage` del `ThrottlerModule`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Hoy la SPA muestra "ThrottlerException: Too Many Requests".                                                                                       |
| D22 | Se renombra `VerificacionPublica` a `VerificacionRecibo` (esquema, tipo, tarjeta y textos).                                                                                                                                                                                                                                                                                                                                                                                                                                                     | "Pública" contradice ADR-015.                                                                                                                     |
| D23 | "Verificar recibo" entra en la barra lateral para ADMIN y OPERADOR en lugar del botón "Verificación pública"; se quitan los enlaces públicos del login, la página 404 y `ErrorBoundary`.                                                                                                                                                                                                                                                                                                                                                        | ADR-015.                                                                                                                                          |
| D24 | `infra/k6/verificacion-publica.js` pasa a `verificacion-recibo.js`, con sesión. Se elimina `THROTTLE_VERIFICACION_PUBLICA_LIMIT`; hasta S5 rige el límite global por IP.                                                                                                                                                                                                                                                                                                                                                                        | ADR-015 pide un escenario autenticado.                                                                                                            |
| D25 | Pruebas: la app e2e activa `trust proxy` y cada caso envía su `X-Forwarded-For`; Playwright hace lo mismo con `page.setExtraHTTPHeaders`. Las pruebas que cambian contraseñas crean su usuario: el seed no las restablece.                                                                                                                                                                                                                                                                                                                      | Sin IP propia, el límite de 5 inicios por minuto cruza pruebas. El `upsert` del seed usa `update: {}`.                                            |
| D26 | Playwright solo para lo que necesita navegador (volver atrás tras logout, inactividad con `page.clock`) y solo en Chromium. HU-06 se prueba con e2e del API y Vitest.                                                                                                                                                                                                                                                                                                                                                                           | Los tres motores son de HT-09 (S8).                                                                                                               |
| D27 | Documentación: ADR-016 nuevo y ADR-015 enmendado. `CLAUDE.md` queda solo con el mapa técnico; sus reglas pasan a `AGENTS.md` o a `apps/api/src/modules/README.md`. `AGENTS.md` remite a `CLAUDE.md`. El autor agrega ADR-016 a la tabla 11-1.                                                                                                                                                                                                                                                                                                   | OpenCode no carga `CLAUDE.md`; `docs/referencia/` no se edita.                                                                                    |
| D28 | `TransaccionPagoLinea` queda fuera del esquema (ADR-014); en S2 solo se corrige `CLAUDE.md` y se reporta.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Regla de alcance; sus campos se fijan contra el entorno de pruebas de PayPhone.                                                                   |
| D29 | Horas: el retiro de la verificación pública se imputa a HU-03; el modelo de sesiones, a HU-01 (criterio 4), HU-02 y HU-06.                                                                                                                                                                                                                                                                                                                                                                                                                      | Trazabilidad del informe.                                                                                                                         |

## A3. Estado de partida (verificado el 06/10/2026)

- **Auth existente:** login, refresh, logout y `GET /auth/me`; argon2 (`Argon2HasherAdapter` y el
  seed); cookie `oasis_refresh` `httpOnly`, `SameSite=Strict`, `Path=/api/v1/auth` y `secure` según
  `req.secure`; `@Throttle` de 5/min en login y 20/min en refresh y logout. No hay ni un e2e de
  autenticación: las demás suites solo inician sesión en su `beforeAll`.
- **Defecto:** `RedisAlmacenRefreshAdapter` guarda un `jti` por usuario (`refresh:<usuarioId>`) y
  `RefrescarSesionUseCase` llama a `revocarTodos` ante un `jti` desconocido. Si alguien inicia
  sesión en dos equipos, el refresco del primero borra la sesión del segundo.
- `JwtEstrategia` no tiene estado: un access token sigue válido hasta 15 min después del logout.
- `RolesGuard` deja pasar sin `@Roles` (hoy, `GET /auth/me`).
- `@Public()`: login, refresh, logout, health, metrics y `VerificacionPublicaController`
  (`GET /api/v1/public/recibos/:codigo/verificacion`, 20/min con `THROTTLE_VERIFICACION_PUBLICA_LIMIT`,
  aunque RNF-12 dice 30).
- `MisPagosController` valida el `clienteId` en el controlador; `mis-polizas`, en el caso de uso.
- **SPA:** refresco single-flight por pestaña (`refrescarToken`), restauración al cargar
  (`useRestaurarSesion`), menú lateral filtrado por rol (`ENLACES`). Rutas públicas `/verificar` y
  `/verificar/:codigo`; enlaces públicos en el login, el menú lateral, la 404 y `ErrorBoundary`; el QR
  apunta a `/verificar/:codigo`. No hay pruebas del menú ni del login.
- **Dependencias de la verificación pública:** paso 5 de `apps/web/e2e/flujo-completo.spec.ts`, dos
  casos de `apps/api/test/flujo-anclaje.e2e-spec.ts`, `infra/k6/verificacion-publica.js`,
  `infra/k6/lib.js`, `.env.example`, `docs/despliegue.md` §7 y `auditoria-cobertura.spec.ts`.
- El seed crea los usuarios con `upsert` y `update: {}`: no restablece contraseñas.
- `ConfigModule.forRoot` devuelve una promesa de `DynamicModule`; el descubrimiento de rutas la salta.
- Pruebas según el informe de S1: 30 de contratos, 76 unitarias del API, 36 de la SPA, 17 e2e del
  API (4 suites) y 1 de Playwright (solo Chromium).
- **Árbol de trabajo:** 13 archivos modificados y 2 ADR nuevos con la actualización de alcance del
  06/10. `README.md` no pasa Prettier por dos líneas en blanco sobrantes.
- OpenCode solo carga `AGENTS.md`. `impeccable` está en `.agents/skills`; superpowers y ponytail son
  plugins de OpenCode.
- El ERS `.docx` de `docs/` está desactualizado (RF-33 todavía dice "página pública"; no tiene
  RF-36 en adelante). Manda el backlog.
- **Entorno (informe de S1, §8):**
  - `pnpm` es el binario de Windows aunque se invoque desde WSL: las variables exportadas en la
    shell no le llegan sin `WSLENV`.
  - Si Windows define `CONTRACT_ADDRESS`, esa variable pisa el `.env` local.
  - Antes de Playwright, limpia `bull:anclaje-recibos:*` si quedaron trabajos de otras corridas.
  - En Windows, el watcher del worker de `pnpm dev` puede fallar con EPERM; los e2e y Playwright
    arrancan el worker desde `dist`.

## A4. Fase A0 — Preparación (0,5 h)

### T0. Rama y línea base

```bash
git switch main && git pull --ff-only
git switch -c feat/sprint-03-acceso-sesiones   # se lleva la actualización de alcance sin commitear
pnpm install --frozen-lockfile
pnpm -r build
pnpm exec prettier --write README.md            # solo quita dos líneas en blanco sobrantes
pnpm -r lint && pnpm format:check && pnpm -r typecheck && pnpm deps:check && pnpm test
```

Verificación: `git status --short` lista los 13 archivos modificados y los 2 ADR nuevos, y la línea
base queda en verde. Si algo falla antes de tocar código, detente y repórtalo.

## A5. Fase A1 — Contratos compartidos (0,5 h)

### T1. Constantes de sesión y esquemas (TDD en la SPA)

`packages/shared/src/constants/sesion.ts` (nuevo) y su `export * from './constants/sesion'` en
`packages/shared/src/index.ts`:

```ts
/** Cierre por inactividad (HU-32, ADR-016): la SPA y el API usan los mismos valores. */
export const INACTIVIDAD_SESION_MS = 30 * 60_000;

/** Antelación del aviso con opción de continuar. */
export const AVISO_INACTIVIDAD_MS = 60_000;

/** Intervalo mínimo entre latidos de la SPA mientras hay actividad sin peticiones. */
export const LATIDO_SESION_MS = 60_000;

/** El servidor espera un latido más que la SPA, para no cerrar nunca antes que ella. */
export const TTL_SESION_SEGUNDOS = (INACTIVIDAD_SESION_MS + LATIDO_SESION_MS) / 1_000;
```

En `packages/shared/src/schemas/auth.schema.ts`:

```ts
/** Política de contraseñas (HU-06): el backlog exige 8 caracteres; 128 acota el costo de argon2. */
export const contrasenaSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña admite como máximo 128 caracteres');

export const cambiarContrasenaSchema = z
  .object({
    actual: z.string().min(1, 'Ingrese su contraseña actual').max(128),
    nueva: contrasenaSchema,
  })
  .refine((datos) => datos.nueva !== datos.actual, {
    path: ['nueva'],
    message: 'La nueva contraseña debe ser distinta de la actual',
  });

export type CambiarContrasenaInput = z.infer<typeof cambiarContrasenaSchema>;
```

En `packages/shared/src/schemas/recibo.schema.ts`, renombra `verificacionPublicaSchema` a
`verificacionReciboSchema` y `VerificacionPublica` a `VerificacionRecibo` (D22), con el comentario
"Resultado de verificar un recibo: solo identificadores opacos, hashes, estado y metadatos de la
cadena (nunca datos personales)". En `packages/shared/src/types/index.ts` exporta
`VerificacionRecibo` y `CambiarContrasenaInput`.

Pruebas primero, en `apps/web/src/contratos/esquemas-compartidos.spec.ts`, un `describe` de
`cambiarContrasenaSchema`: rechaza una nueva de 7 caracteres, una de 129, una igual a la actual y
una actual vacía; acepta una válida.

Verificación: `pnpm --filter @oasis/shared build && pnpm --filter @oasis/web test esquemas`.

## A6. Fase A2 — Sesiones por familia (HU-01, HU-02; 3,5 h)

### T2. Tiempo límite compartido (0,25 h)

Mueve `conTiempoLimite` de `apps/api/src/infrastructure/health/health.indicators.ts` a
`apps/api/src/shared-kernel/tiempo-limite.ts` (TypeScript puro), con el tiempo como parámetro, e
importa desde ahí en los indicadores:

```ts
/**
 * Rechaza si la promesa no termina a tiempo. Imprescindible con Redis: BullMQ configura
 * `maxRetriesPerRequest: null` y un comando con el servidor caído queda encolado sin fin.
 */
export function conTiempoLimite<T>(
  promesa: Promise<T>,
  descripcion: string,
  ms = 2_000,
): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const temporizador = setTimeout(
      () => rechazar(new Error(`${descripcion} no respondió en ${ms} ms`)),
      ms,
    );
    promesa
      .then((valor) => {
        clearTimeout(temporizador);
        resolver(valor);
      })
      .catch((error: unknown) => {
        clearTimeout(temporizador);
        rechazar(error instanceof Error ? error : new Error(String(error)));
      });
  });
}
```

Verificación: `pnpm --filter @oasis/api test health` sigue en verde.

### T3. Puerto y adaptador de sesiones (1 h)

Reemplaza `application/ports/almacen-refresh.port.ts` por `almacen-sesiones.port.ts`:

```ts
export const ALMACEN_SESIONES = Symbol('AlmacenSesionesPort');

export type ResultadoRotacion = 'ROTADA' | 'EXPIRADA' | 'REUTILIZADA';

/**
 * Sesiones activas por familia de rotación (ADR-016): cada `sid` guarda su `jti` vigente con un TTL
 * de inactividad que se desliza con cada uso.
 */
export interface AlmacenSesionesPort {
  abrir(usuarioId: string, sid: string, jti: string): Promise<void>;
  /** Cambia el `jti` vigente; un `jti` que no es el vigente revoca la sesión (reutilización). */
  rotar(
    usuarioId: string,
    sid: string,
    jtiPresentado: string,
    jtiNuevo: string,
  ): Promise<ResultadoRotacion>;
  /** Extiende la inactividad; false si la sesión ya no existe. */
  tocar(usuarioId: string, sid: string): Promise<boolean>;
  cerrar(usuarioId: string, sid: string): Promise<void>;
  cerrarDemas(usuarioId: string, sidVigente: string): Promise<void>;
}
```

Reemplaza `infrastructure/security/redis-almacen-refresh.adapter.ts` por
`redis-almacen-sesiones.adapter.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { TTL_SESION_SEGUNDOS } from '@oasis/shared';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from '../../../../infrastructure/redis/redis.module';
import { ErrorDependenciaExterna } from '../../../../shared-kernel/domain-error';
import { conTiempoLimite } from '../../../../shared-kernel/tiempo-limite';
import type {
  AlmacenSesionesPort,
  ResultadoRotacion,
} from '../../application/ports/almacen-sesiones.port';

const PREFIJO = 'sesion:';

/** 1 rotó, 0 la sesión no existe, -1 el `jti` no es el vigente y la sesión se borra. Atómico. */
const ROTAR = `
local vigente = redis.call('GET', KEYS[1])
if not vigente then
  return 0
end
if vigente ~= ARGV[1] then
  redis.call('DEL', KEYS[1])
  return -1
end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1
`;

@Injectable()
export class RedisAlmacenSesionesAdapter implements AlmacenSesionesPort {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async abrir(usuarioId: string, sid: string, jti: string): Promise<void> {
    await this.redis.set(this.clave(usuarioId, sid), jti, 'EX', TTL_SESION_SEGUNDOS);
  }

  async rotar(
    usuarioId: string,
    sid: string,
    jtiPresentado: string,
    jtiNuevo: string,
  ): Promise<ResultadoRotacion> {
    const resultado = await this.redis.eval(
      ROTAR,
      1,
      this.clave(usuarioId, sid),
      jtiPresentado,
      jtiNuevo,
      String(TTL_SESION_SEGUNDOS),
    );
    if (resultado === 1) {
      return 'ROTADA';
    }
    return resultado === 0 ? 'EXPIRADA' : 'REUTILIZADA';
  }

  async tocar(usuarioId: string, sid: string): Promise<boolean> {
    try {
      const existe = await conTiempoLimite(
        this.redis.expire(this.clave(usuarioId, sid), TTL_SESION_SEGUNDOS),
        'Redis',
      );
      return existe === 1;
    } catch {
      // Falla cerrada: sin Redis no se puede saber si la sesión sigue viva (D9).
      throw new ErrorDependenciaExterna('No se pudo comprobar la sesión');
    }
  }

  async cerrar(usuarioId: string, sid: string): Promise<void> {
    await this.redis.del(this.clave(usuarioId, sid));
  }

  async cerrarDemas(usuarioId: string, sidVigente: string): Promise<void> {
    const vigente = this.clave(usuarioId, sidVigente);
    const flujo = this.redis.scanStream({ match: `${PREFIJO}${usuarioId}:*`, count: 100 });
    for await (const llaves of flujo) {
      const otras = (llaves as string[]).filter((llave) => llave !== vigente);
      if (otras.length > 0) {
        await this.redis.del(...otras);
      }
    }
  }

  private clave(usuarioId: string, sid: string): string {
    return `${PREFIJO}${usuarioId}:${sid}`;
  }
}
```

El adaptador se prueba contra Redis real en los e2e (T18); los casos de uso, con el puerto simulado.

### T4. Emisor de tokens con familia (0,5 h)

`application/ports/emisor-tokens.port.ts`:

```ts
import type { Rol } from '@oasis/shared';

export const EMISOR_TOKENS = Symbol('EmisorTokensPort');

export interface PayloadAccess {
  sub: string;
  email: string;
  rol: Rol;
  clienteId?: string | null;
}

/** Familia de rotación: `sid` estable y vencimiento absoluto en segundos desde epoch (ADR-016). */
export interface FamiliaSesion {
  sid: string;
  expiraEn: number;
}

export interface PayloadRefresh {
  sub: string;
  sid: string;
  jti: string;
  expiraEn: number;
}

export interface TokensEmitidos {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
  familia: FamiliaSesion;
}

export interface EmisorTokensPort {
  /** Sin `familia` abre una nueva; con ella la conserva al rotar. */
  emitir(payload: PayloadAccess, familia?: FamiliaSesion): Promise<TokensEmitidos>;
  verificarRefresh(token: string): Promise<PayloadRefresh | null>;
}
```

`infrastructure/security/jwt-emisor.adapter.ts`:

```ts
async emitir(payload: PayloadAccess, familia?: FamiliaSesion): Promise<TokensEmitidos> {
  const { accessSecret, refreshSecret, accessTtl, refreshTtl } = this.config.auth;
  const vigente: FamiliaSesion = familia ?? {
    sid: randomUUID(),
    expiraEn: Math.floor(Date.now() / 1_000) + duracionASegundos(refreshTtl),
  };
  const refreshJti = randomUUID();

  const accessToken = await this.jwt.signAsync(
    {
      sub: payload.sub,
      email: payload.email,
      rol: payload.rol,
      clienteId: payload.clienteId,
      sid: vigente.sid,
    },
    { secret: accessSecret, expiresIn: accessTtl as JwtSignOptions['expiresIn'] },
  );
  // `exp` explícito: la rotación conserva el vencimiento absoluto de la familia (D8).
  const refreshToken = await this.jwt.signAsync(
    { sub: payload.sub, sid: vigente.sid, jti: refreshJti, exp: vigente.expiraEn },
    { secret: refreshSecret },
  );

  return { accessToken, refreshToken, refreshJti, familia: vigente };
}

async verificarRefresh(token: string): Promise<PayloadRefresh | null> {
  try {
    const payload = await this.jwt.verifyAsync<{
      sub: string;
      sid?: string;
      jti: string;
      exp: number;
    }>(token, { secret: this.config.auth.refreshSecret });
    // Los tokens emitidos antes de las familias no traen `sid` y ya no abren sesión.
    if (!payload.sid) {
      return null;
    }
    return { sub: payload.sub, sid: payload.sid, jti: payload.jti, expiraEn: payload.exp };
  } catch {
    return null;
  }
}
```

### T5. Casos de uso de la sesión (TDD, 1 h)

Escribe primero las pruebas con los puertos simulados:

- `login.use-case.spec.ts` (actualiza): "emite tokens y abre la sesión de la familia" (`abrir` con
  `usuario.id`, `familia.sid` y `refreshJti`); los casos de credenciales inválidas, usuario
  inexistente e inactivo se mantienen.
- `refrescar-sesion.use-case.spec.ts` (nuevo):
  - "rota el jti y conserva la familia" (`emitir` recibe `{ sid, expiraEn }` del token presentado);
  - "con un jti que ya rotó responde 401" (`rotar` devuelve `REUTILIZADA`);
  - "con la sesión expirada responde 401" (`EXPIRADA`);
  - "con el usuario inactivo cierra la sesión y responde 401";
  - "con un token inválido responde 401 sin tocar el almacén".
- `cerrar-sesion.use-case.spec.ts` (nuevo): "cierra la sesión del sid del token" y "sin cookie o con
  un token inválido no hace nada".

Implementación:

```ts
// login.use-case.ts: tras verificar la contraseña
const tokens = await this.emisor.emitir({
  sub: usuario.id,
  email: usuario.email,
  rol: usuario.rol,
  clienteId: usuario.clienteId,
});
await this.sesiones.abrir(usuario.id, tokens.familia.sid, tokens.refreshJti);
return { usuario, tokens };
```

```ts
// refrescar-sesion.use-case.ts
async ejecutar(refreshToken: string): Promise<ResultadoRefresco> {
  const payload = await this.emisor.verificarRefresh(refreshToken);
  if (!payload) {
    throw new NoAutorizadoError('Sesión expirada o inválida');
  }

  const usuario = await this.usuarios.buscarPorId(payload.sub);
  if (!usuario || !usuario.puedeIniciarSesion()) {
    await this.sesiones.cerrar(payload.sub, payload.sid);
    throw new NoAutorizadoError('Usuario no disponible');
  }

  const tokens = await this.emisor.emitir(
    { sub: usuario.id, email: usuario.email, rol: usuario.rol, clienteId: usuario.clienteId },
    { sid: payload.sid, expiraEn: payload.expiraEn },
  );
  const rotacion = await this.sesiones.rotar(
    payload.sub,
    payload.sid,
    payload.jti,
    tokens.refreshJti,
  );
  if (rotacion === 'REUTILIZADA') {
    throw new NoAutorizadoError('Sesión revocada, vuelva a iniciar sesión');
  }
  if (rotacion === 'EXPIRADA') {
    throw new NoAutorizadoError('Sesión expirada, vuelva a iniciar sesión');
  }
  return { usuario, tokens };
}
```

```ts
// cerrar-sesion.use-case.ts
async ejecutar(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    return;
  }
  const payload = await this.emisor.verificarRefresh(refreshToken);
  if (payload) {
    // Por `sid`: cierra la sesión aunque otra pestaña ya haya rotado el jti.
    await this.sesiones.cerrar(payload.sub, payload.sid);
  }
}
```

### T6. Estrategia JWT, controlador y módulo (0,5 h)

En `common/auth/decorators.ts`, `UsuarioAutenticado` agrega `sid: string`.

`infrastructure/security/jwt.estrategia.ts` (prueba primero en `jwt.estrategia.spec.ts`: "devuelve el
usuario con su sid si la sesión vive", "responde 401 si la sesión se cerró" y "responde 401 si el
token no trae sid"):

```ts
@Injectable()
export class JwtEstrategia extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: AppConfig,
    @Inject(ALMACEN_SESIONES) private readonly sesiones: AlmacenSesionesPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.auth.accessSecret,
    });
  }

  async validate(payload: PayloadJwt): Promise<UsuarioAutenticado> {
    // Una sesión cerrada (logout, cambio de contraseña, inactividad) invalida su access token al instante.
    if (!payload.sid || !(await this.sesiones.tocar(payload.sub, payload.sid))) {
      throw new NoAutorizadoError('La sesión se cerró; inicie sesión de nuevo');
    }
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      clienteId: payload.clienteId ?? null,
      sid: payload.sid,
    };
  }
}
```

`PayloadJwt` agrega `sid?: string`. En `auth.controller.ts`:

- `obtenerSesion` lleva `@Roles(...ROLES)` (`ROLES` de `@oasis/shared`): con D11, sin roles daría 403.
- `escribirCookie` recibe `expiraEn` y usa
  `maxAge: Math.max(0, expiraEn * 1_000 - Date.now())`; login y refresh pasan
  `tokens.familia.expiraEn`. La cookie vence con la familia (D8).
- Quita el import de `duracionASegundos` si queda sin uso.

En `auth.module.ts`, `{ provide: ALMACEN_SESIONES, useClass: RedisAlmacenSesionesAdapter }` y los
factories de `LoginUseCase`, `RefrescarSesionUseCase` y `CerrarSesionUseCase` con el nuevo puerto.

### T7. `no-store` y 429 en español (0,25 h)

`apps/api/src/common/interceptors/sin-cache.interceptor.ts`:

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import type { Observable } from 'rxjs';

/** Ninguna respuesta del API queda en la caché del navegador (HU-02: "atrás" no muestra datos). */
@Injectable()
export class SinCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      context.switchToHttp().getResponse<Response>().setHeader('Cache-Control', 'no-store');
    }
    return next.handle();
  }
}
```

En `app.module.ts`:

- registra `{ provide: APP_INTERCEPTOR, useClass: SinCacheInterceptor }`;
- el `useFactory` del `ThrottlerModule` devuelve también
  `errorMessage: 'Demasiadas solicitudes. Espere un minuto e intente de nuevo.'`;
- el comentario del orden de los guards pasa a "(login, refresh y logout)".

### Verificación de la Fase A2

```bash
pnpm --filter @oasis/api test && pnpm --filter @oasis/api typecheck && pnpm deps:check
```

## A7. Fase A3 — Acceso por rol y verificación con sesión (HU-03; 5 h)

### T8. Denegación por defecto (TDD, 0,5 h)

Pruebas primero en `common/auth/roles.guard.spec.ts`: "deja pasar una ruta pública", "niega con 403
una ruta sin @Roles", "niega con 403 un rol no incluido", "deja pasar un rol incluido" y "@Roles del
handler prevalece sobre el de la clase".

```ts
canActivate(context: ExecutionContext): boolean {
  const destino = [context.getHandler(), context.getClass()];
  if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, destino)) {
    return true;
  }
  const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, destino);
  const usuario = context.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>().user;
  // Sin @Roles se niega: una ruta nueva nunca queda abierta a cualquier autenticado (HU-03).
  if (!rolesRequeridos?.length || !usuario || !rolesRequeridos.includes(usuario.rol)) {
    throw new ProhibidoError('No tiene permisos para realizar esta acción');
  }
  return true;
}
```

### T9. Descubrimiento de rutas y pruebas de cobertura (1 h)

`apps/api/test/rutas-declaradas.ts` (lo incluyen `tsconfig.json` y `tsconfig.spec.json`):

```ts
import type { DynamicModule, Type } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, MODULE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { Rol } from '@oasis/shared';

import { AppModule } from '../src/app.module';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../src/common/auth/decorators';

export interface RutaDeclarada {
  /** `Controlador.handler`, como en la cobertura de @Auditar. */
  clave: string;
  metodo: RequestMethod;
  /** Ruta completa con el prefijo global (salvo /metrics). */
  ruta: string;
  esPublica: boolean;
  roles: Rol[];
  handler: (...args: unknown[]) => unknown;
}

/** Controladores registrados en el grafo de módulos, sin instanciar nada. */
export function controladores(raiz: Type<unknown> = AppModule): Type<unknown>[] {
  const visitados = new Set<unknown>();
  const encontrados = new Set<Type<unknown>>();

  const visitar = (importado: unknown): void => {
    // `ConfigModule.forRoot` devuelve una promesa y `forwardRef` un objeto: ninguno trae controladores.
    if (!importado || visitados.has(importado) || importado instanceof Promise) {
      return;
    }
    visitados.add(importado);
    const dinamico =
      typeof importado === 'object' && 'module' in importado
        ? (importado as DynamicModule)
        : undefined;
    const clase = dinamico ? dinamico.module : importado;
    if (typeof clase !== 'function') {
      return;
    }
    const propios = (Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, clase) ??
      []) as Type<unknown>[];
    for (const controlador of [...propios, ...(dinamico?.controllers ?? [])]) {
      encontrados.add(controlador);
    }
    const hijos = (Reflect.getMetadata(MODULE_METADATA.IMPORTS, clase) ?? []) as unknown[];
    for (const hijo of [...hijos, ...(dinamico?.imports ?? [])]) {
      visitar(hijo);
    }
  };

  visitar(raiz);
  return [...encontrados];
}

export function rutasDeclaradas(raiz: Type<unknown> = AppModule): RutaDeclarada[] {
  return controladores(raiz).flatMap((controlador) => {
    const base = String(Reflect.getMetadata(PATH_METADATA, controlador) ?? '');
    return Object.getOwnPropertyNames(controlador.prototype).flatMap((nombre) => {
      const handler = Object.getOwnPropertyDescriptor(controlador.prototype, nombre)?.value as
        RutaDeclarada['handler'] | undefined;
      const metodo =
        typeof handler === 'function'
          ? (Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined)
          : undefined;
      if (!handler || metodo === undefined) {
        return [];
      }
      const subruta = String(Reflect.getMetadata(PATH_METADATA, handler) ?? '');
      const segmentos = [base, subruta].filter((s) => s.length > 0 && s !== '/');
      const prefijo = base === 'metrics' ? '' : '/api/v1';
      return [
        {
          clave: `${controlador.name}.${nombre}`,
          metodo,
          ruta: `${prefijo}/${segmentos.join('/')}`.replace(/\/+/g, '/'),
          esPublica: Boolean(
            Reflect.getMetadata(IS_PUBLIC_KEY, handler) ??
            Reflect.getMetadata(IS_PUBLIC_KEY, controlador),
          ),
          roles: (Reflect.getMetadata(ROLES_KEY, handler) ??
            Reflect.getMetadata(ROLES_KEY, controlador) ??
            []) as Rol[],
          handler,
        },
      ];
    });
  });
}
```

`apps/api/src/common/auth/roles-cobertura.spec.ts`:

```ts
import { rutasDeclaradas } from '../../../test/rutas-declaradas';

/** Únicas rutas sin JWT (ADR-015). La recuperación de contraseña se sumará con HU-31. */
const PUBLICAS = [
  'AuthController.cerrarSesion',
  'AuthController.iniciarSesion',
  'AuthController.refrescarSesion',
  'HealthController.check',
  'MetricsController.obtener',
];

describe('cobertura de @Roles', () => {
  it('solo las rutas de ADR-015 son públicas', () => {
    const publicas = rutasDeclaradas()
      .filter((ruta) => ruta.esPublica)
      .map((ruta) => ruta.clave)
      .sort();
    expect(publicas).toEqual(PUBLICAS);
  });

  it('toda ruta no pública declara al menos un rol', () => {
    const sinRoles = rutasDeclaradas().filter((ruta) => !ruta.esPublica && ruta.roles.length === 0);
    expect(sinRoles.map((ruta) => ruta.clave)).toEqual([]);
  });
});
```

En `auditoria-cobertura.spec.ts`, reemplaza la lista `CONTROLADORES` y el recorrido manual por
`rutasDeclaradas()` filtrando los métodos de mutación. `EXENTOS` y `ESPERADAS` se mantienen; T14
agrega el cambio de contraseña.

Verificación: la prueba de roles falla hasta T10, porque `VerificacionPublicaController` sigue siendo
pública. Es el rojo esperado.

### T10. Verificación solo para el personal (API, 0,75 h)

1. Borra `presentation/http/verificacion-publica.controller.ts` y quítalo de `recibos.module.ts`.
2. En `RecibosController` (ya tiene `@Roles('ADMIN', 'OPERADOR')` en la clase) agrega:

   ```ts
   @Get(':codigo/verificacion')
   @ApiOperation({ summary: 'Verifica un recibo contra el contrato (exige sesión, ADR-015)' })
   async verificar(
     @ZodParamCampo('codigo', codigoReciboSchema) codigo: string,
   ): Promise<VerificacionRecibo> {
     return this.verificarRecibo.ejecutar(codigo);
   }
   ```

   Inyecta `VerificarReciboUseCase` en el constructor. `GET /recibos/:id` no choca: tiene un solo
   segmento.

3. En `verificar-recibo.use-case.ts`, el comentario de clase pasa a "Verificación de un recibo:
   recalcula el hash desde la base de datos, lo compara con el registrado en la cadena y devuelve solo
   datos opacos".
4. Elimina `THROTTLE_VERIFICACION_PUBLICA_LIMIT` de `config/env.schema.ts`, `config/throttle.ts`
   (`Limites`), `config/app.config.ts` (`ConfiguracionThrottle` y el getter) y `.env.example`.
5. En `apps/api/test/flujo-anclaje.e2e-spec.ts`, los dos casos usan
   `GET /api/v1/recibos/:codigo/verificacion` con el token del operador y pasan a llamarse "ancla el
   recibo y lo verifica con la sesión del operador" y "la verificación no expone datos personales".

### T11. RN-07 de `mis-pagos` en un caso de uso (TDD, 0,5 h)

Pruebas primero (`listar-pagos-de-cliente.use-case.spec.ts` o un `describe` en el archivo de casos de
uso de pagos): "sin clienteId lanza ProhibidoError" y "filtra por el clienteId del usuario".

```ts
export class ListarPagosDeClienteUseCase {
  constructor(private readonly pagos: PagosRepositoryPort) {}

  ejecutar(
    clienteId: string | null | undefined,
    filtros: Omit<FiltrosPagos, 'clienteId'>,
  ): Promise<PaginaPagos> {
    if (!clienteId) {
      throw new ProhibidoError('El usuario no está asociado a un cliente');
    }
    return this.pagos.listar({ ...filtros, clienteId });
  }
}
```

Regístralo en `pagos.module.ts` y úsalo en `MisPagosController`, que deja de validar el `clienteId`.

### T12. SPA: verificación protegida y menú por rol (1,5 h)

1. `src/app/router.tsx`:
   - quita las rutas `/verificar` y `/verificar/:codigo`, y el enlace "Verificar un recibo" de
     `NoEncontrado`;
   - dentro del grupo `RutaProtegida roles={['ADMIN', 'OPERADOR']}` agrega
     `/recibos/verificar` y `/recibos/verificar/:codigo` con `VerificacionPage`. Las rutas estáticas
     ganan a `/recibos/:id`, pero déjalas antes por claridad.
2. `components/layout/AppLayout.tsx`:
   - agrega a `ENLACES`
     `{ a: '/recibos/verificar', texto: 'Verificar recibo', icono: ScanSearch, roles: ['ADMIN', 'OPERADOR'] }`;
   - "Recibos" no debe quedar activo en `/recibos/verificar`: dale `excluye: '/recibos/verificar'` y
     marca activo `isActive && !pathname.startsWith(excluye)`;
   - quita el botón "Verificación pública" y la prop `navegar` que solo lo servía.
3. `features/verificacion/`:
   - `api.ts` llama a ``api.get<VerificacionRecibo>(`/recibos/${encodeURIComponent(codigo)}/verificacion`)``;
   - en `hooks.ts`, el comentario pasa a "Verificación del recibo en la cadena (exige sesión,
     ADR-015)";
   - en `pages/VerificacionPage.tsx`:
     - la página vive dentro del layout: sin `min-h-screen` ni centrado de pantalla completa;
     - título "Verificar recibo" y descripción "Compruebe la autenticidad de un recibo con su código o
       el QR impreso";
     - navega a `/recibos/verificar/:codigo`;
     - se quita el enlace "Acceso para personal autorizado";
     - conserva los `data-testid`.
4. `features/recibos/components/TarjetaVerificacionPublica.tsx` pasa a `TarjetaVerificacion.tsx`:
   - la ruta es `/recibos/verificar/${codigo}` y el QR usa `${window.location.origin}` más esa ruta;
   - título "Verificación del recibo" y descripción "Quien escanee el QR debe iniciar sesión para ver
     el resultado";
   - botón "Abrir verificación" con `data-testid="enlace-verificacion"`.

   Actualiza `ReciboDetallePage.tsx`.

5. Quita los enlaces públicos de `LoginPage.tsx` (párrafo "¿Necesita verificar un recibo?") y de
   `ErrorBoundary.tsx`.
6. Pruebas en `components/layout/AppLayout.test.tsx` (nuevo; `MemoryRouter`, `QueryClientProvider` y
   el estado de `useAuthStore` fijado con `setState`):
   - "el ADMIN ve Bitácora y Verificar recibo";
   - "el OPERADOR no ve Bitácora";
   - "el CLIENTE solo ve Inicio".

### T13. k6 y documentación de carga (0,25 h)

`infra/k6/verificacion-publica.js` pasa a `infra/k6/verificacion-recibo.js`:

```js
// Escenario k6: verificación de recibos con sesión (ADR-015). Hasta S5 rige el límite global por
// IP; la cadencia se calcula desde él.
//
// Uso: k6 run -e BASE_URL=https://dominio -e EMAIL=... -e PASSWORD=... infra/k6/verificacion-recibo.js
import http from 'k6/http';
import { check, sleep } from 'k6';

import { iniciarSesion, limite } from './lib.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const LIMITE = limite('global');
const ITERACIONES_POR_MINUTO = Math.max(1, Math.floor(LIMITE * 0.8));
const VUS = Math.min(10, ITERACIONES_POR_MINUTO);
const ESPERA_SEGUNDOS = Math.round((60 * VUS) / ITERACIONES_POR_MINUTO);

const ESTADOS_VALIDOS = ['VALIDO', 'ANULADO', 'NO_ANCLADO', 'NO_ENCONTRADO', 'HASH_INCONSISTENTE'];

export const options = {
  scenarios: {
    verificacion_recibo: { executor: 'constant-vus', vus: VUS, duration: '45s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<700'],
    checks: ['rate>0.98'],
  },
};

export function setup() {
  const sesion = iniciarSesion(BASE_URL);
  const listado = http.get(`${BASE_URL}/api/v1/recibos?page=1&pageSize=10`, {
    headers: sesion.cabeceras,
  });
  const codigos = (listado.json('data') || []).map((r) => r.codigo);
  if (codigos.length === 0) {
    throw new Error('No hay recibos para verificar; ejecuta el flujo completo antes.');
  }
  return { codigos, cabeceras: sesion.cabeceras };
}

export default function (datos) {
  const codigo = datos.codigos[__ITER % datos.codigos.length];
  const respuesta = http.get(`${BASE_URL}/api/v1/recibos/${codigo}/verificacion`, {
    headers: datos.cabeceras,
  });

  check(respuesta, {
    'verificación 200': (r) => r.status === 200,
    'estado conocido': (r) => ESTADOS_VALIDOS.includes(r.json('estado')),
    'no filtra datos personales': (r) => !/[@"]nombre|identificacion|apellidos/.test(r.body),
    'no expone la sal ni el payload': (r) => !/"sal"|"payloadCanonico"/.test(r.body),
    'devuelve hash recalculado': (r) => /^0x[0-9a-f]{64}$/i.test(r.json('hashRecibo') || ''),
  });

  sleep(ESPERA_SEGUNDOS);
}
```

Quita `verificacionPublica` de `LIMITE_POR_DEFECTO` en `infra/k6/lib.js`. En `docs/despliegue.md`
§7.1 elimina la línea `THROTTLE_VERIFICACION_PUBLICA_LIMIT=300`, y en §7.2 cambia el script por
`verificacion-recibo.js`.

### Verificación de la Fase A3

```bash
pnpm --filter @oasis/shared build
pnpm --filter @oasis/api test && pnpm --filter @oasis/web test
pnpm -r typecheck && pnpm -r lint && pnpm deps:check
grep -rn "public/recibos\|verificacionPublica\|VerificacionPublica\|THROTTLE_VERIFICACION" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=generated \
  apps packages infra .env.example docs/despliegue.md   # sin resultados
```

## A8. Fase A4 — Cambiar contraseña (HU-06; 2,5 h)

### T14. API (TDD, 1,25 h)

1. En `UsuarioAuthRepositoryPort` agrega el método `actualizarPasswordHash(id, passwordHash)`, que
   devuelve `Promise<void>`, e impleméntalo en `PrismaUsuarioAuthRepository` con
   `prisma.usuario.update`.
2. Pruebas primero en `cambiar-contrasena.use-case.spec.ts`:
   - "con la contraseña actual incorrecta lanza ValidacionError en el campo actual y no cambia nada";
   - "guarda el nuevo hash y cierra las demás sesiones, no la actual";
   - "con un usuario inexistente lanza NoEncontradoError".
3. `application/use-cases/cambiar-contrasena.use-case.ts`:

   ```ts
   export class CambiarContrasenaUseCase {
     constructor(
       private readonly usuarios: UsuarioAuthRepositoryPort,
       private readonly hasher: HasherPort,
       private readonly sesiones: AlmacenSesionesPort,
     ) {}

     async ejecutar(
       usuarioId: string,
       sidVigente: string,
       actual: string,
       nueva: string,
     ): Promise<void> {
       const usuario = await this.usuarios.buscarPorId(usuarioId);
       if (!usuario) {
         throw new NoEncontradoError('Usuario', usuarioId);
       }
       if (!(await this.hasher.verificar(usuario.passwordHash, actual))) {
         const mensaje = 'La contraseña actual no es correcta';
         // Mismo formato que los issues de Zod: la SPA lo muestra en el campo.
         throw new ValidacionError(mensaje, [{ path: ['actual'], message: mensaje }]);
       }
       await this.usuarios.actualizarPasswordHash(usuarioId, await this.hasher.hashear(nueva));
       await this.sesiones.cerrarDemas(usuarioId, sidVigente);
     }
   }
   ```

4. Handler en `AuthController`; regístralo en `auth.module.ts` con
   `USUARIO_AUTH_REPOSITORY`, `HASHER` y `ALMACEN_SESIONES`:

   ```ts
   @Roles(...ROLES)
   @Throttle({ default: { limit: limitesThrottle().login, ttl: 60_000 } })
   @Post('cambiar-contrasena')
   @Auditar('MODIFICAR', 'Usuario')
   @HttpCode(204)
   @ApiOperation({ summary: 'Cambia la contraseña y cierra las demás sesiones del usuario' })
   async cambiarContrasena(
     @UsuarioActual() usuario: UsuarioAutenticado,
     @Body(new ZodValidationPipe(cambiarContrasenaSchema)) input: CambiarContrasenaInput,
   ): Promise<void> {
     await this.cambiar.ejecutar(usuario.id, usuario.sid, input.actual, input.nueva);
   }
   ```

5. En `auditoria-cobertura.spec.ts` agrega
   `'AuthController.cambiarContrasena': { accion: 'MODIFICAR', entidad: 'Usuario' }`.
6. `auditoria.interceptor.ts` (D16). Prueba primero en `auditoria.interceptor.spec.ts`: "sin id
   explícito, una acción sobre Usuario apunta al propio usuario".

   ```ts
   entidadId:
     peticion.params?.id ??
     leerId(respuesta) ??
     leerId(respuesta, 'usuario') ??
     // Sin id explícito, quien actúa sobre Usuario es el propio usuario (login, cambio de contraseña).
     (metadato.entidad === 'Usuario' ? usuarioId : null),
   ```

### T15. SPA (1,25 h)

1. `features/auth/api.ts`:
   `cambiarContrasena: (datos: CambiarContrasenaInput) => api.post<void>('/auth/cambiar-contrasena', datos)`.
   En `hooks.ts`, `useCambiarContrasena()` con `useMutation`.
2. `features/auth/pages/CambiarContrasenaPage.tsx`, con React Hook Form y `zodResolver`, el mismo
   estilo de campos que `LoginPage` y `autoComplete` `current-password` / `new-password`:

   ```ts
   const formularioSchema = cambiarContrasenaSchema
     .safeExtend({ confirmacion: z.string().min(1, 'Confirme la nueva contraseña') })
     .refine((datos) => datos.confirmacion === datos.nueva, {
       path: ['confirmacion'],
       message: 'La confirmación no coincide con la nueva contraseña',
     });
   ```

   - **Éxito:** `toast.success('Contraseña actualizada. Se cerraron sus otras sesiones.')` y
     `navegar('/', { replace: true })`.
   - **Error:** si el `ApiError` trae en `details` un issue con `path[0] === 'actual'`,
     `formulario.setError('actual', { message }, { shouldFocus: true })`; si no, `toast.error` con el
     mensaje.
   - **Accesibilidad:** `aria-invalid`, `aria-describedby` y mensajes con `role="alert"`, como en
     `LoginPage`.

3. Registra la ruta `/cuenta/contrasena` dentro de `AppLayout`, fuera de los grupos por rol. En el
   menú del usuario agrega
   `<DropdownMenuItem asChild><Link to="/cuenta/contrasena" data-testid="enlace-cambiar-contrasena">Cambiar contraseña</Link></DropdownMenuItem>`.
4. Pruebas en `CambiarContrasenaPage.test.tsx` (API simulada con `vi.mock('../api')`):
   - "valida la longitud y la confirmación antes de enviar";
   - "muestra el error de la contraseña actual en su campo";
   - "al cambiarla avisa y vuelve al inicio".

   En `AppLayout.test.tsx`: "el menú del usuario ofrece cambiar la contraseña".

## A9. Fase A5 — Cierre por inactividad (HU-32; 2,5 h)

### T16. Store y cliente de API (0,75 h)

`lib/auth-store.ts`:

```ts
/** Por qué terminó la última sesión; el login lo muestra hasta el siguiente ingreso. */
export type MotivoCierre = 'inactividad' | 'expirada';

// estado: `motivoCierre: MotivoCierre | null` (inicial null)
establecerSesion: (respuesta) =>
  set({
    accessToken: respuesta.accessToken,
    usuario: respuesta.usuario,
    autenticado: true,
    motivoCierre: null,
  }),
cerrarSesionLocal: (motivo?: MotivoCierre) =>
  set({ accessToken: null, usuario: null, autenticado: false, motivoCierre: motivo ?? null }),
```

`lib/api-client.ts`:

- `Sesion.cerrarSesionLocal` pasa a `(motivo?: 'expirada') => void`, y el cierre tras un refresco
  fallido llama a `cerrarSesionLocal('expirada')`.
- `apiFetch` registra `ultimaPeticion = Date.now()` al empezar y se exporta:

  ```ts
  /** Milisegundos desde la última petición al API; el latido de inactividad la usa para no duplicarla. */
  export function msDesdeUltimaPeticion(): number {
    return Date.now() - ultimaPeticion;
  }

  /**
   * Serializa el refresco entre pestañas: dos rotaciones simultáneas con la misma cookie se tomarían
   * como reutilización del token y cerrarían la sesión (ADR-016).
   */
  function enExclusiva<T>(tarea: () => Promise<T>): Promise<T> {
    return typeof navigator !== 'undefined' && 'locks' in navigator
      ? navigator.locks.request('oasis-refresco', tarea)
      : tarea();
  }
  ```

  y `refrescarToken` envuelve el `fetch` de `/auth/refresh` en `enExclusiva(() => fetch(...))`.

Pruebas en `api-client.test.ts`:

- actualiza "cierra sesión y vacía la caché cuando la renovación falla" para que espere
  `cerrarSesionLocal('expirada')`;
- agrega "serializa el refresco con Web Locks cuando el navegador lo ofrece", con
  `Object.defineProperty(navigator, 'locks', …)` y la aserción del nombre `oasis-refresco`.

### T17. Inactividad y avisos (TDD, 1,75 h)

`features/auth/hooks.ts`. `useLogout` pasa a recibir el motivo, avisa a las otras pestañas y
`AppLayout` llama a `logout.mutate(null)`:

```ts
const CLAVE_ACTIVIDAD = 'oasis:ultima-actividad';
const CLAVE_CIERRE = 'oasis:sesion-cerrada';
const EVENTOS_ACTIVIDAD = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'touchstart',
  'scroll',
];
/** `pointermove` llega decenas de veces por segundo: la actividad se comparte cada 5 s como mucho. */
const ESCRITURA_ACTIVIDAD_MS = 5_000;

/** Con `localStorage` bloqueado (modo privado) cada pestaña sigue solo con su reloj. */
function leerActividadCompartida(): number {
  try {
    return Number(localStorage.getItem(CLAVE_ACTIVIDAD)) || 0;
  } catch {
    return 0;
  }
}

function compartir(clave: string, valor: string): boolean {
  try {
    localStorage.setItem(clave, valor);
    return true;
  } catch {
    return false;
  }
}

export function useLogout() {
  const cerrarSesionLocal = useAuthStore((estado) => estado.cerrarSesionLocal);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_motivo: MotivoCierre | null) => authApi.logout(),
    onSettled: (_datos, _error, motivo) => {
      // El sufijo cambia el valor en cada cierre: `storage` solo se dispara si el valor cambia.
      compartir(CLAVE_CIERRE, `${motivo ?? 'manual'}:${Date.now()}`);
      cerrarSesionLocal(motivo ?? undefined);
      queryClient.clear();
    },
  });
}
```

`useInactividad()` en el mismo archivo devuelve `{ segundosRestantes, continuar, cerrarSesion }`:

- **Al montar:** marca la actividad (una sesión nueva no hereda la inactividad de la anterior) y
  escribe `CLAVE_ACTIVIDAD`.
- **Actividad:** listeners de `EVENTOS_ACTIVIDAD` en `window` con `{ capture: true, passive: true }`.
  - Cada evento actualiza la marca local y, si pasaron `ESCRITURA_ACTIVIDAD_MS`, la compartida.
  - Si `msDesdeUltimaPeticion() >= LATIDO_SESION_MS`, envía el latido con
    `void authApi.me().catch(() => null)`. Un 401 lo resuelve el api-client; un fallo de red solo
    pierde ese latido.
  - Con el aviso abierto, los eventos no cuentan.
- **Reloj:** `setInterval` de 1 s.
  - Calcula `inactivo = Date.now() - Math.max(marcaLocal, leerActividadCompartida())`.
  - Si `inactivo >= INACTIVIDAD_SESION_MS`, ejecuta `logout.mutate('inactividad')` una sola vez.
  - Si falta `AVISO_INACTIVIDAD_MS` o menos, publica los segundos restantes; si no, `null`. Así el
    aviso se cierra solo cuando otra pestaña registra actividad.
- **`storage`:** si cambia `CLAVE_CIERRE`, ejecuta `cerrarSesionLocal` con el motivo leído antes de
  `:` (`inactividad` o ninguno) y `queryClient.clear()`.
- **`continuar`:** oculta el aviso, fuerza la escritura compartida (cierra el aviso en las demás
  pestañas) y registra actividad con latido.
- **`cerrarSesion`:** es `logout.mutate(null)`.

`features/auth/components/AvisoInactividad.tsx`, montado en `AppLayout`:

```tsx
export function AvisoInactividad() {
  const { segundosRestantes, continuar, cerrarSesion } = useInactividad();
  const botonContinuar = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={segundosRestantes !== null}
      onOpenChange={(abierto) => {
        if (!abierto) {
          continuar();
        }
      }}
    >
      <DialogContent
        role="alertdialog"
        aria-describedby="aviso-inactividad"
        onOpenAutoFocus={(evento) => {
          evento.preventDefault();
          botonContinuar.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>¿Sigue ahí?</DialogTitle>
          {/* Sin aria-live: el lector la anuncia al abrir, no cada segundo. */}
          <DialogDescription id="aviso-inactividad">
            Su sesión se cerrará por inactividad en {segundosRestantes} s.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cerrarSesion}>
            Cerrar sesión
          </Button>
          <Button ref={botonContinuar} onClick={continuar}>
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

`LoginPage.tsx` lee `motivoCierre` del store y, si existe, muestra encima del formulario un aviso fijo
(`role="status"`, `data-testid="aviso-cierre"`): "Su sesión se cerró por inactividad." o "Su sesión se
cerró. Inicie sesión de nuevo.".

Pruebas primero:

- `features/auth/components/AvisoInactividad.test.tsx`, con `vi.useFakeTimers()` y `localStorage` de
  jsdom:
  - "avisa un minuto antes de los 30 minutos";
  - "a los 30 minutos cierra la sesión por inactividad" (llama a logout y deja `motivoCierre`
    `inactividad`);
  - "Continuar reinicia el plazo y envía un latido";
  - "la actividad de otra pestaña pospone el cierre" (escribe `oasis:ultima-actividad`);
  - "el cierre de otra pestaña cierra esta" (despacha un `StorageEvent` con `oasis:sesion-cerrada`);
  - "el latido sale como máximo una vez por minuto".
- `features/auth/pages/LoginPage.test.tsx`:
  - "muestra el mensaje genérico del API ante credenciales inválidas";
  - "muestra el aviso de cierre por inactividad";
  - "muestra el aviso de cierre desde el servidor".

Revisión de UI con `impeccable` y `accessibility`: foco inicial en "Continuar", `Escape` y la X
equivalen a continuar, contraste, 360 px y navegación por teclado.

## A10. Fase A6 — Evidencia e2e (3 h)

### T18. `apps/api/test/auth.e2e-spec.ts` (1,5 h)

Montaje:

- `createNestApplication<NestExpressApplication>({ logger: false })`;
- `app.set('trust proxy', 1)`, `app.use(cookieParser())` y
  `app.setGlobalPrefix('api/v1', { exclude: ['metrics'] })`;
- `prisma = app.get(PrismaService)` y `redis = app.get(REDIS_CLIENT)`.

Utilidades:

- `ip()`: IP única por petición (`198.51.100.N`) para `X-Forwarded-For` (D25).
- `crearUsuario(rol, { activo })`: crea el usuario con Prisma y `argon2.hash`, con un correo único y
  la contraseña `Prueba.Oasis1`.
- `cookieDe(respuesta)`: extrae `oasis_refresh` del `set-cookie`.
- `payloadDe(jwt)`: decodifica el payload con base64url y entrega `sid` y `exp`.

Casos:

1. "con credenciales válidas emite el access token y la cookie httpOnly de renovación": `set-cookie`
   con `HttpOnly`, `SameSite=Strict` y `Path=/api/v1/auth`.
2. "con credenciales inválidas responde el mismo mensaje genérico": contraseña incorrecta, correo
   inexistente y usuario inactivo dan 401 con el mismo `message` ("Credenciales inválidas").
3. "el sexto intento en un minuto desde la misma IP devuelve 429": misma IP fija en los 6 intentos;
   el sexto responde 429 con el mensaje en español.
4. "renueva la sesión con la cookie y conserva el vencimiento absoluto": refresh 200 con otro access
   token; el `exp` del refresh nuevo es igual al anterior y el `sid` se mantiene.
5. "reutilizar una cookie ya rotada cierra esa sesión": el refresh con la cookie vieja da 401 y el
   access token de esa familia también da 401.
6. "guarda las contraseñas con argon2id": el `passwordHash` del seed empieza con `$argon2id$`.
7. "dos inicios de sesión del mismo usuario conviven": refrescar en uno no cierra el otro (el
   defecto de la sección A3).
8. "cerrar sesión invalida en el servidor la renovación y el access token":
   - el logout responde 204 y su `set-cookie` vence `oasis_refresh`;
   - el refresh con esa cookie da 401 y `GET /auth/me` con ese token da 401;
   - una respuesta autenticada previa trae `Cache-Control: no-store`.
9. "cerrar sesión en un equipo no cierra la del otro".
10. "rechaza la contraseña actual incorrecta en su campo": 400 `VALIDACION` con `details[0].path`
    igual a `['actual']`.
11. "rechaza una contraseña nueva de menos de 8 caracteres o igual a la actual": 400.
12. "cambia la contraseña, mantiene la sesión actual y cierra las demás al instante":
    - 204; `/auth/me` responde 200 con la sesión actual y 401 con la otra, cuyo refresh también da
      401;
    - el login con la nueva contraseña da 200 y con la anterior da 401;
    - el hash nuevo es `$argon2id$`;
    - la bitácora registra `MODIFICAR`/`Usuario` con `entidadId` igual al usuario y
      `campos: ['actual', 'nueva']`.
13. "cada petición renueva el TTL de 31 minutos de la sesión": tras el login, `TTL sesion:<id>:<sid>`
    está entre 1 800 y 1 860; tras un `EXPIRE` a 30 s, `GET /auth/me` lo devuelve a unos 1 860.
14. "una sesión vencida en el servidor rechaza el access token y la renovación": tras `DEL` de la
    llave, `/auth/me` y el refresh dan 401.

### T19. `apps/api/test/acceso-por-rol.e2e-spec.ts` (1 h)

```ts
const RUTAS = rutasDeclaradas().filter((ruta) => !ruta.esPublica);
const ID_CUALQUIERA = '00000000-0000-4000-8000-000000000000';
const VERBOS = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.DELETE]: 'delete',
} as const;

// Los guards corren antes que los pipes: no hacen falta parámetros ni cuerpos válidos.
function peticion(ruta: RutaDeclarada) {
  const verbo = VERBOS[ruta.metodo as keyof typeof VERBOS];
  return request(app.getHttpServer())
    [verbo](ruta.ruta.replace(/:[^/]+/g, ID_CUALQUIERA))
    .set('X-Forwarded-For', ip());
}

it.each(RUTAS.map((ruta) => [ruta.clave, ruta] as const))(
  '%s exige token',
  async (_clave, ruta) => {
    await peticion(ruta).expect(401);
  },
);

const PROHIBIDAS = RUTAS.flatMap((ruta) =>
  ROLES.filter((rol) => !ruta.roles.includes(rol)).map(
    (rol) => [`${ruta.clave} con ${rol}`, ruta, rol] as const,
  ),
);

it.each(PROHIBIDAS)('%s responde 403', async (_nombre, ruta, rol) => {
  await peticion(ruta).set('Authorization', `Bearer ${tokens[rol]}`).expect(403);
});
```

Los tokens de los 3 roles salen del seed en `beforeAll`, cada uno con su IP. Agrega el caso "el
CLIENTE solo obtiene sus pólizas y pagos":

- crea con Prisma un segundo cliente (`PASAPORTE`, identificación única), su usuario CLIENTE, una
  póliza VIGENTE (aseguradora, ramo y método de pago del seed) y un pago REGISTRADO;
- `/mis-polizas` y `/mis-pagos` del cliente del seed no contienen esos registros, y los del cliente
  nuevo contienen solo los suyos.

La matriz ya cubre que el CLIENTE recibe 403 en `/recibos`, `/recibos/:id` y
`/recibos/:codigo/verificacion`.

### T20. Playwright (0,5 h)

- Cada prueba envía su IP con
  `await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '10.3.0.N' })` (D25), y el `request` de la
  preparación también. En desarrollo Vite reenvía la cabecera y el API confía en un salto
  (`trust proxy = 1`).
- `apps/web/e2e/flujo-completo.spec.ts`, paso 5:
  - cierra sesión y abre `/recibos/verificar/${codigo}`;
  - espera `/login`, inicia sesión y comprueba que vuelve al resultado `VALIDO` con el mismo hash.
  - Renombra la prueba a "flujo completo de validación, anclaje y verificación con sesión".
- `apps/web/e2e/sesion.spec.ts`:
  - "volver atrás después de cerrar sesión no muestra datos protegidos": login → Pagos → cerrar
    sesión → `page.goBack()` → sigue en `/login` y no hay encabezados "Hola," ni "Pagos".
  - "avisa a los 29 minutos sin actividad y cierra la sesión a los 30":
    - `page.clock.install()` antes de navegar, login y `fastForward('29:00')`;
    - aparece el `alertdialog`;
    - `fastForward('01:00')` lleva a `/login` con `aviso-cierre` igual a "Su sesión se cerró por
      inactividad.".
  - "Continuar mantiene la sesión": con el aviso visible, clic en "Continuar"; el diálogo se cierra
    y el usuario sigue en la página.

### Verificación de la Fase A6

Con la infraestructura arriba (sección A12.1): `pnpm test:e2e` y `pnpm --filter @oasis/web test:e2e`.

## A11. Fase A7 — Documentación (1,5 h)

### T21. ADR-016 y ADR-015

`docs/adr/ADR-016-sesiones-redis.md` (nuevo):

```markdown
# ADR-016 · Sesiones por familia de rotación con cierre por inactividad en Redis

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S2

## Contexto

El almacén de refresh guardaba un solo `jti` por usuario y, ante un `jti` desconocido, revocaba
todo: si alguien iniciaba sesión en dos equipos, el refresco del primero cerraba la sesión del
segundo. HU-02 pide invalidar la sesión en el servidor, HU-06 cerrar las demás sesiones al cambiar
la contraseña y HU-32 cerrar tras 30 minutos sin actividad, también cuando la pestaña se cierra sin
salir y la cookie de 7 días sigue viva en un equipo compartido.

## Decisión

- Cada inicio de sesión abre una familia: `sesion:<usuarioId>:<sid>` en Redis guarda el `jti`
  vigente con un TTL de 31 minutos. Ambos tokens llevan el `sid`.
- `JwtEstrategia` hace `EXPIRE` en cada petición autenticada: comprueba que la sesión vive y desliza
  su TTL en una operación. Logout, cambio de contraseña e inactividad cierran la sesión al instante.
  Si Redis no responde en 2 s, la petición falla con 502.
- El refresco rota el `jti` con un script Lua atómico y conserva el vencimiento absoluto de la
  familia (7 días desde el inicio de sesión). Un `jti` que no es el vigente revoca esa familia.
- La SPA mide la inactividad por interacción en pantalla, compartida entre pestañas, avisa a los
  29 minutos y cierra a los 30. Mientras hay actividad envía como máximo un latido por minuto; por
  eso el servidor espera 31 minutos. Los valores están en `@oasis/shared`.

## Alternativas descartadas

- **Access token sin estado**: logout y cambio de contraseña tardarían hasta 15 minutos en surtir
  efecto, y la inactividad solo se comprobaría al refrescar.
- **Una sesión por usuario**: no habría "demás sesiones" que cerrar y, para que dos equipos no se
  tumbaran, habría que renunciar a la detección de reutilización.
- **Inactividad solo en la SPA**: una pestaña cerrada deja la cookie restaurando la sesión.

## Consecuencias

- Positivas: revocación inmediata, varias sesiones por usuario sin interferencias y un token robado
  no vive más de 7 días.
- Negativas: una operación de Redis por petición autenticada y Redis en el camino crítico del API.
  Las consultas automáticas mantienen viva la sesión en el servidor mientras la pestaña está
  abierta; en ese caso el cierre lo hace la SPA.
```

`docs/adr/ADR-015-acceso-solo-autenticado.md`:

- Estado: "aceptado (S2: regla de acceso; S5: verificación del cliente)"; Sprint: "S2 y S5".
- La sección "Decisión" queda así:

```markdown
- Todas las rutas de negocio exigen JWT. Sin JWT quedan solo el inicio de sesión, la renovación y
  el cierre de sesión (los dos últimos se autentican con la cookie de renovación), la recuperación
  de contraseña (HU-31) y las sondas de infraestructura `/health` y `/metrics`; esta última está
  fuera del prefijo y Caddy no la publica (ADR-009).
- La regla se hace cumplir en el código: `RolesGuard` niega toda ruta que no declare `@Roles`, una
  prueba fija la lista de rutas públicas y exige roles en las demás, y un e2e comprueba 401 y 403
  en todas las rutas.
- La verificación del recibo (HU-28; RF-33, RF-34) pasa a `GET /api/v1/recibos/:codigo/verificacion`.
  En S2 la usan ADMIN y OPERADOR; en S5 (HU-28) se abre al CLIENTE solo para sus recibos (RN-07): un
  recibo ajeno responde "No encontrado", y el límite es de 30 consultas por minuto por usuario
  (RNF-12).
- El QR del recibo apunta a `/recibos/verificar/:codigo` en la SPA, que pide iniciar sesión si no
  hay sesión activa.
- Se retiran `VerificacionPublicaController`, la ruta `public/`, `THROTTLE_VERIFICACION_PUBLICA_LIMIT`
  y el escenario k6 `verificacion-publica.js`, que se reemplaza por `verificacion-recibo.js`.
```

- En "Consecuencias", negativas, agrega: "Entre S2 y S5 el CLIENTE no puede verificar recibos; no
  hay clientes reales hasta el despliegue (S7)".
- En `docs/adr/README.md`, ADR-015 pasa a "S2 y S5" y se agrega la fila de ADR-016 (S2,
  `ADR-016-sesiones-redis.md`).

### T22. `CLAUDE.md`, `AGENTS.md`, reglas del API, README y fichas

`CLAUDE.md` queda solo con el mapa técnico (D27):

1. **"Hash y privacidad" (L30–36):** reemplaza la frase "Hoy vive en … la migración se hace con
   HU-28" por: "La verificación (`GET /api/v1/recibos/:codigo/verificacion`) recalcula el hash desde
   la base y lo compara con `verificar()`; los resultados posibles están en `ESTADOS_VERIFICACION`
   de `@oasis/shared`. Hoy es solo del personal; HU-28 (S5) la abre al CLIENTE para sus recibos,
   con 30 consultas por minuto por usuario (ADR-015)."
2. **"API: tubería" (L40–46):**
   - Guards: `ThrottlerGuard` → `JwtAuthGuard` (JWT válido y sesión viva en Redis; `@Public()` lo
     omite) → `RolesGuard` (niega si el handler o la clase no declaran `@Roles(...)`). El usuario
     llega con `@UsuarioActual()`, con su `sid`.
   - Auditoría: deja solo el mecanismo, `AuditoriaInterceptor` y el trigger. La regla "toda mutación
     declara `@Auditar`" sale de aquí.
   - Agrega: "`SinCacheInterceptor` (global, en `AppModule`) pone `Cache-Control: no-store` en toda
     respuesta".
3. **Sección nueva "Sesiones (ADR-016)":**
   - la llave `sesion:<usuarioId>:<sid>` con el `jti` vigente y TTL `TTL_SESION_SEGUNDOS`;
   - `EXPIRE` por petición: 401 si la llave no existe y 502 si Redis no responde en 2 s;
   - la rotación con Lua en `RedisAlmacenSesionesAdapter`, que conserva el `exp` de la familia;
   - en la SPA: Web Locks (`oasis-refresco`), `useInactividad` en `features/auth/hooks.ts`, las
     claves `oasis:ultima-actividad` y `oasis:sesion-cerrada`, el latido a `GET /auth/me` y las
     constantes en `@oasis/shared` (`constants/sesion.ts`).
4. **"Configuración y datos" (L65–66):** "…incluidas tablas de historias futuras (ADR-010), salvo
   `TransaccionPagoLinea` (ADR-014), que HU-48 habría agregado (HU-48 se retiró del alcance)…".
5. **"SPA" (L85–89):**
   - deja solo dónde vive cada cosa: rutas en `router.tsx`, menú lateral (`ENLACES`) y menú del
     usuario en `AppLayout.tsx`; la regla "una página nueva se registra en ambos" sale de aquí;
   - el api-client renueva una sola vez, de forma deduplicada en la pestaña y serializada entre
     pestañas; si no puede, cierra la sesión con el motivo `expirada`, que muestra el login.
6. **"Pruebas" (L94–101):**
   - agrega `trust proxy` + `X-Forwarded-For` en los e2e y `page.setExtraHTTPHeaders` en Playwright;
   - agrega que el seed no restablece contraseñas (`update: {}`), así que las pruebas que las cambian
     crean su usuario;
   - agrega que `test/rutas-declaradas.ts` alimenta la cobertura de `@Roles` y `@Auditar` y el e2e de
     acceso por rol.
7. **L110–112 (scopes de commitlint):** sale a `AGENTS.md`.

`AGENTS.md`:

1. Bajo "Léela completa antes de cambiar código." agrega: "Lee también `CLAUDE.md` (mapa técnico) y
   `apps/api/src/modules/README.md` (reglas de los módulos del API)."
2. En "Convenciones" agrega:
   - **Acceso y auditoría**: todo handler declara `@Roles(...)` o `@Public()`, y toda mutación
     `@Auditar(accion, entidad)`; las rutas públicas y las exenciones están en
     `apps/api/src/modules/README.md`.
   - **SPA**: una página nueva se registra en `router.tsx` con sus roles y se enlaza desde el menú
     lateral de `AppLayout`; las páginas de la cuenta del usuario, desde su menú en el encabezado.
3. En "Commits" agrega: commitlint también admite `docker` y `release`, con encabezados de hasta 100
   caracteres, y el hook `pre-commit` corre Prettier y ESLint con `--fix`.
4. En "Decisiones": "…(IDs de la tabla 11-1 de la arquitectura; un ADR nuevo toma el número
   siguiente y el informe del sprint pide al autor agregarlo a la tabla; índice en
   `docs/adr/README.md`)".

`apps/api/src/modules/README.md`, sección nueva después de "Auditoría (HU-45)":

```markdown
## Acceso (HU-03, ADR-015)

- Todo handler declara `@Roles(...)` (en el handler o en la clase) o `@Public()`. `RolesGuard`
  responde 403 si no hay roles: una ruta nueva nunca queda abierta a cualquier autenticado.
- Solo son públicas `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /health` y
  `GET /metrics`; la recuperación de contraseña se sumará con HU-31. `roles-cobertura.spec.ts` falla
  si cambia esa lista o si una ruta queda sin roles, y `acceso-por-rol.e2e-spec.ts` comprueba 401
  sin token y 403 para cada rol no permitido.
- Los datos del CLIENTE se filtran en un caso de uso con su `clienteId` (RN-07), no solo en el
  controlador.
```

En "Auditoría (HU-45)": la prueba descubre los controladores con `test/rutas-declaradas.ts` y las
exenciones siguen listadas en ella.

Resto de la documentación:

- **`README.md`, tabla de pruebas:** actualiza los conteos y lo que cubre cada suite. Unitarias del
  API: sesiones, acceso por rol y cambio de contraseña. e2e del API: autenticación y acceso por rol.
  SPA: menú por rol, contraseña, inactividad y login. Playwright: verificación con sesión, "atrás"
  tras logout e inactividad. Quita "verificación pública sin sesión".
- **`docs/arquitectura/c4-contexto.md` y `componentes-recibos.md`:** la nota "Pendiente en el código
  (ADR-015)" pasa a "**Estado (ADR-015):** la verificación exige sesión
  (`GET /api/v1/recibos/:codigo/verificacion`), por ahora solo para el personal; HU-28 (S5) la abre
  al CLIENTE para sus recibos".
- **`docs/arquitectura/c4-contenedores.md` (L27 y L47):** "refresh tokens (rotación)" pasa a
  "sesiones por familia con inactividad (ADR-016)".

## A12. Fase A8 — Cierre (1,5 h)

### A12.1 Definición de Terminado

Antes de la DoD, revisa el diff completo con `ponytail-review` y corrige lo que señale dentro del
alcance; lo demás va como deuda al informe.

Con PostgreSQL y Redis de `compose.dev.yaml` y el nodo Hardhat (con `pnpm dev:infra` o en nativo con
`pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1`):

```bash
pnpm install --frozen-lockfile
pnpm -r build
pnpm -r lint
pnpm format:check
pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                                             # contratos, API y SPA
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # sin migraciones nuevas en este sprint
pnpm --filter @oasis/api seed
pnpm test:e2e                                         # health, flujo, idempotencia, bitácora, auth y acceso
pnpm --filter @oasis/web test:e2e                     # flujo completo y sesión
```

Pruebas manuales (anota el resultado en el informe):

- Mismo usuario en un navegador normal y en una ventana privada:
  - cerrar sesión en una no afecta a la otra;
  - cambiar la contraseña en una saca a la otra en su siguiente acción;
  - la que cambió sigue dentro.
- Sin sesión, abrir el enlace del QR de un recibo lleva al login y, tras ingresar, muestra el
  resultado.
- Como CLIENTE, el menú solo muestra Inicio y `/recibos/verificar` redirige al inicio.
- La página de contraseña y el aviso de inactividad a 360 px, con teclado y con lector de pantalla.

### A12.2 Informe del sprint

Escribe la Etapa A del informe `docs/sprints/sprint-s2.md`, con la estructura del informe de S1:

1. **Encabezado:** historias, épica (EP-01), rama, fechas y estado.
2. **Objetivo.**
3. **Entregables:** tabla con su ubicación.
4. **Criterios de cada historia con su evidencia** (sección A14).
5. **Definición de Terminado:** tabla de estado.
6. **Versiones:** solo cambian si se actualizó alguna dependencia; ninguna es necesaria.
7. **Decisiones y discrepancias:**
   - ADR-015 enmendado y ADR-016.
   - El ERS `.docx` está desactualizado (RF-33 "página pública"; RNF-12 "verificación pública 30";
     sin RF-36 en adelante); manda el backlog.
   - `THROTTLE_VERIFICACION_PUBLICA_LIMIT` valía 20 y RNF-12 pide 30; se elimina y el límite por
     usuario llega en S5.
   - La tabla 6-1 de la arquitectura dice NestJS 12; se usa 11 (S1).
   - ADR-010 asume el modelo completo, pero `TransaccionPagoLinea` no está en el esquema (ADR-014).
   - La lista literal de rutas públicas de ADR-015 no incluía logout ni `/metrics`; se enmendó.
   - ADR-015 y `CLAUDE.md` situaban la migración de la verificación en S5; la regla de acceso se
     adelantó a S2.
8. **Impedimentos y observaciones:** incluye que las sesiones abiertas antes de S2 no traen `sid` y
   piden iniciar sesión una vez.
9. **Deuda y fuera de alcance:**
   - CLIENTE en la verificación y límite por usuario (S5);
   - cierre de sesiones al desactivar un usuario (HU-04, Etapa B);
   - cambio obligatorio de la contraseña temporal (HU-05, S6);
   - recuperación de contraseña (HU-31, S7);
   - desborde a 360 px (HT-04, Etapa B);
   - Firefox y WebKit (S8).
10. **Acciones del autor:** agregar ADR-016 a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md`.
11. **Cómo verificar:** los comandos de A12.1.

## A13. Commit y entrega

Revisa con `git status` que no entren `.env`, `.claude/`, `*.docx`, `ignition/deployments/chain-31337`
ni artefactos, y que sí estén los documentos de la actualización de alcance. Haz un solo commit:

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar la etapa A del sprint S2 con acceso por rol, sesiones y cambio de contraseña

- Alcance: backlog v1.1, arquitectura v1.3, ADR-014 y ADR-015 (actualización del 06/10).
- HU-01 y HU-02: sesiones por familia en Redis con revocación inmediata, 7 días absolutos,
  refresco serializado entre pestañas, no-store y 429 en español.
- HU-03: RolesGuard niega por defecto, cobertura de @Roles, matriz e2e de 401 y 403, RN-07 de
  mis-pagos en un caso de uso y verificación de recibos con sesión (ADR-015).
- HU-06: POST /auth/cambiar-contrasena y página /cuenta/contrasena.
- HU-32: aviso a los 29 minutos y cierre a los 30, compartido entre pestañas.
- Docs: ADR-015 enmendado, ADR-016, AGENTS.md, CLAUDE.md, plan e informe de la etapa A del S2.

Refs: HU-01, HU-02, HU-03, HU-06, HU-32
EOF
```

No hagas push. Termina con un mensaje al usuario que incluya:

- el resumen de la verificación de A12.1 y de las pruebas manuales;
- el recordatorio de agregar ADR-016 a la tabla 11-1;
- el título del PR (el encabezado del commit);
- este cuerpo de PR, listo para pegar:

```markdown
## Resumen

S2, Etapa A: inicio y cierre de sesión con sesiones por familia (HU-01, HU-02), control de acceso por
rol con la regla de ADR-015 (HU-03), cambio de contraseña (HU-06) y cierre por inactividad (HU-32).
Incluye la actualización de alcance del 06/10. Informe: `docs/sprints/sprint-s2.md`.

## Criterios de aceptación

- [x] HU-01: token y cookie httpOnly; mensaje genérico; 429 al sexto intento; renovación; argon2
- [x] HU-02: sesión invalidada en el servidor; cookie eliminada; "atrás" sin datos
- [x] HU-03: roles en cada ruta y 403; menú por rol; el CLIENTE solo obtiene lo suyo
- [x] HU-06: exige la actual; 8 caracteres; cierra las demás sesiones
- [x] HU-32: cierre a los 30 minutos; aviso un minuto antes; redirección al login

## Pendiente

- Agregar ADR-016 a la tabla 11-1 de la arquitectura.
- Aceptación del Product Owner en la revisión del sprint.
```

## A14. Trazabilidad criterio → evidencia

| Criterio                                        | Evidencia                                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| HU-01.1 token y cookie httpOnly                 | `auth.e2e-spec.ts` caso 1                                                                                        |
| HU-01.2 mensaje genérico                        | `auth.e2e-spec.ts` caso 2; `LoginPage.test.tsx`                                                                  |
| HU-01.3 sexto intento → 429                     | `auth.e2e-spec.ts` caso 3                                                                                        |
| HU-01.4 renovación automática                   | `auth.e2e-spec.ts` casos 4, 5 y 7; `refrescar-sesion.use-case.spec.ts`; `api-client.test.ts`                     |
| HU-01.5 argon2                                  | `auth.e2e-spec.ts` casos 6 y 12                                                                                  |
| HU-02.1 renovación invalidada en el servidor    | `auth.e2e-spec.ts` casos 8 y 9; `cerrar-sesion.use-case.spec.ts`                                                 |
| HU-02.2 cookie eliminada y redirección al login | `auth.e2e-spec.ts` caso 8; `sesion.spec.ts` (Playwright)                                                         |
| HU-02.3 "atrás" sin datos protegidos            | `sesion.spec.ts`; `Cache-Control: no-store` en `auth.e2e-spec.ts` caso 8                                         |
| HU-03.1 roles declarados y 403                  | `roles-cobertura.spec.ts`, `roles.guard.spec.ts` y la matriz de `acceso-por-rol.e2e-spec.ts`                     |
| HU-03.2 menú por rol                            | `AppLayout.test.tsx`                                                                                             |
| HU-03.3 el CLIENTE solo obtiene lo suyo         | `acceso-por-rol.e2e-spec.ts` (dos clientes y 403 en recibos); prueba de `ListarPagosDeClienteUseCase`            |
| HU-06.1 exige la contraseña actual              | `cambiar-contrasena.use-case.spec.ts`; `auth.e2e-spec.ts` caso 10; `CambiarContrasenaPage.test.tsx`              |
| HU-06.2 al menos 8 caracteres                   | `esquemas-compartidos.spec.ts`; `auth.e2e-spec.ts` caso 11; `CambiarContrasenaPage.test.tsx`                     |
| HU-06.3 cierra las demás sesiones               | `cambiar-contrasena.use-case.spec.ts`; `auth.e2e-spec.ts` caso 12                                                |
| HU-32.1 cierre a los 30 minutos                 | `AvisoInactividad.test.tsx`; `sesion.spec.ts`; `auth.e2e-spec.ts` casos 13 y 14 (servidor)                       |
| HU-32.2 aviso un minuto antes con continuar     | `AvisoInactividad.test.tsx`; `sesion.spec.ts`                                                                    |
| HU-32.3 redirección al inicio de sesión         | `sesion.spec.ts` (aviso fijo en `/login`); `LoginPage.test.tsx`                                                  |
| ADR-015, regla de acceso                        | `roles-cobertura.spec.ts` (lista exacta); `flujo-anclaje.e2e-spec.ts` con token; `flujo-completo.spec.ts` paso 5 |

## A15. Estimación

| Fase | Tareas                                              | Historia     |  Horas |
| ---- | --------------------------------------------------- | ------------ | -----: |
| A0   | Rama y línea base (T0)                              | HU-01        |    0,5 |
| A1   | Contratos compartidos (T1)                          | HU-06, HU-32 |    0,5 |
| A2   | Sesiones por familia, `no-store` y 429 (T2 a T7)    | HU-01, HU-02 |    3,5 |
| A3   | Acceso por rol y verificación con sesión (T8 a T13) | HU-03        |      5 |
| A4   | Cambiar contraseña (T14 y T15)                      | HU-06        |    2,5 |
| A5   | Cierre por inactividad (T16 y T17)                  | HU-32        |    2,5 |
| A6   | e2e del API y Playwright (T18 a T20)                | Todas        |      3 |
| A7   | ADR y documentación (T21 y T22)                     | HU-03        |    1,5 |
| A8   | Definición de Terminado, informe y commit           | Todas        |    1,5 |
| —    | Holgura                                             | —            |    1,5 |
|      | **Total**                                           |              | **22** |

En el informe, las horas por historia siguen el backlog: HU-01 8 h, HU-02 3 h, HU-03 6 h, HU-06 3 h y
HU-32 2 h (D29). La etapa dispone de 25 de las 50 h del sprint; quedan 3 h de reserva.

---

# ETAPA B — Base de la SPA, usuarios del personal, clientes y aseguradoras (HT-04, HU-04, HU-07, HU-11)

## B0. Reglas de ejecución

1. Ejecuta las fases en orden: B0 → B1 → B2 → B3 → B4 → B5 → B6 → B7.
2. TDD en toda lógica nueva: primero la prueba en rojo y luego el código (`test-driven-development`).
   Antes de cerrar una fase usa `verification-before-completion` y guarda la salida para el informe.
3. Al empezar cada fase, invoca las skills de su fila en la tabla de la sección B0.1, en el orden de
   `AGENTS.md`: skill de proceso → skill de la tecnología → ponytail decide el tamaño.
4. Tras cambiar `packages/shared/src`, ejecuta `pnpm --filter @oasis/shared build` para que el API y
   la SPA vean el cambio, y borra `apps/web/node_modules/.vite`: Vite no invalida el prebundle de un
   paquete del workspace cuando cambia su `dist` (informe de S1, §8).
5. Nunca edites `docs/referencia/`.
6. **Un solo commit** al final (sección B13), sin líneas de atribución (`Co-Authored-By`, "Generated
   with…"). Antes, comprueba que `git config user.name` sea `JohannCaizaguano`. **No hagas push ni
   abras el PR**: los hace el usuario.
7. No adelantes trabajo de otros sprints; lo que quede fuera de alcance se anota como deuda en el
   informe (sección B12.2).
8. Comentarios solo para el porqué no obvio y en español (`AGENTS.md`). Las simplificaciones
   deliberadas llevan un comentario `ponytail:` con el techo y la salida.

### B0.1 Skills por fase

| Momento                               | Skills                                                                                                                                           | Para qué                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Todo el sprint                        | `executing-plans`, `ponytail`                                                                                                                    | Seguir el plan fase por fase con el diff más corto que funcione.         |
| Toda lógica nueva                     | `test-driven-development`                                                                                                                        | Prueba en rojo antes del código.                                         |
| Un fallo o una prueba roja inesperada | `systematic-debugging`                                                                                                                           | Causa raíz antes de cambiar código.                                      |
| Cierre de cada fase                   | `verification-before-completion`                                                                                                                 | Evidencia (salida de los comandos) antes de declarar la fase terminada.  |
| Fase B1 (T24 y T25)                   | `zod`, `typescript-advanced-types`, `vitest`                                                                                                     | Validadores de RN-11, `superRefine`, esquemas de usuario y sus pruebas.  |
| Fase B2 (T26)                         | `prisma-cli`, `prisma-client-api`                                                                                                                | Migración con relleno de `nombre` y seed.                                |
| Fase B2 (T27 a T29)                   | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`, `prisma-client-api`                                                 | Puerto de sesiones, casos de uso, módulos, controlador y `P2002`.        |
| Fase B3 (T30 y T31)                   | `nestjs-best-practices`, `prisma-client-api`, `zod`                                                                                              | RN-11 en el API, retiro de `DELETE` y permisos de aseguradoras.          |
| Fase B4 (T32 y T33)                   | `react-best-practices`, `composition-patterns`, `shadcn`, `tailwind-v4-shadcn`, `tailwind-css-patterns`, `impeccable`, `accessibility`, `vitest` | Auditoría de HT-04, 360 px, tabla paginada compartida y `alert-dialog`.  |
| Fase B5 (T34 a T36)                   | `react-hook-form`, `zod`, `react-best-practices`, `shadcn`, `tailwind-css-patterns`, `impeccable`, `frontend-design`, `accessibility`, `vitest`  | Páginas de usuarios, aseguradoras y clientes, formularios y sus pruebas. |
| Fase B6, API (T37)                    | `nestjs-best-practices`, `prisma-client-api`                                                                                                     | e2e con Supertest y datos de prueba.                                     |
| Fase B6, SPA (T38)                    | `playwright-best-practices`                                                                                                                      | Flujo del personal entre dos contextos y la prueba de 360 px.            |
| Fase B7 (cierre)                      | `ponytail-review`, `verification-before-completion`                                                                                              | Revisar el diff completo y ejecutar la Definición de Terminado.          |
| Si Vite sirve un prebundle viejo      | `vite`                                                                                                                                           | Caché de `optimizeDeps` tras recompilar `@oasis/shared`.                 |

No aplican: `brainstorming` y `writing-plans` (el diseño y el plan ya están acordados),
`bash-defensive-patterns` (no hay scripts bash nuevos), `prisma-postgres`, `prisma-database-setup` y
`seo`. La documentación (T39) sigue las reglas de `AGENTS.md` sin skill propia.

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

- `executing-plans` pide un espacio aislado, pero **no crees un worktree**: trabaja en la rama de T23
  sobre esta copia.
- Su ledger vive en `.superpowers/sdd/sprint-s2-plan/`, que ya está en `.gitignore`.
- Sin commits por tarea: el único commit es el de la sección B13.
- Las decisiones de la sección B2 no se reabren con un "ruling". Si una deja de ser viable, detente y
  pregunta; los demás desvíos menores van al ledger y al informe como discrepancias.
- Al terminar, si `finishing-a-development-branch` ofrece opciones, elige "conservar la rama tal
  cual": sin merge, push ni PR.

## B1. Alcance

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

### Pendientes de la Etapa A que entran en esta etapa

- Cierre de las sesiones al desactivar un usuario (HU-04).
- Desborde a 360 px de `/`, `/pagos` y `/recibos` (HT-04).

### Fuera de alcance (no implementar)

- Editar y desactivar clientes (HU-08, S3): el `PATCH /clientes/:id` existente se queda como está,
  sin la regla "identificación fija si tiene pólizas" ni la desactivación.
- Búsqueda, filtro de activos y paginación de 20 en 20 de clientes (HU-09, S3): la búsqueda `q`
  existente se queda como está.
- Cuentas de CLIENTE y cambio obligatorio de la contraseña temporal en el primer ingreso (HU-05,
  S6), también para el personal.
- Recuperación de contraseña (HU-31, S7).
- Verificación del CLIENTE y límite por usuario (HU-28, S5).
- Firefox y WebKit en Playwright (HT-09, S8).

## B2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Motivo                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D30 | Plan con el formato de la Etapa A, ejecutado por OpenCode; un solo commit sin atribuciones; push y PR los hace el usuario. Fechas de la etapa: 28/09–02/10, la segunda semana de S2.                                                                                                                                                                                                                                                                                                                                                                     | `AGENTS.md` y preferencia del desarrollador.                                                                                                           |
| D31 | Alcance: HT-04, HU-04, HU-07 y HU-11, más los dos pendientes de la Etapa A que le corresponden. El código existente de edición y búsqueda de clientes no se toca salvo para RN-11.                                                                                                                                                                                                                                                                                                                                                                       | Regla de alcance.                                                                                                                                      |
| D32 | `Usuario.nombre String` obligatorio, con una migración que rellena las filas existentes: personal → parte local del correo; CLIENTE → `razonSocial` o `nombres apellidos` del cliente vinculado. Auth lee la columna y se elimina `nombreVisible` de `PrismaUsuarioAuthRepository`. El seed crea "Administrador Oasis", "Operador Oasis" y, para el cliente, su nombre; `update: {}` no cambia.                                                                                                                                                          | HU-04 pide nombre y el modelo no lo tiene. El relleno cubre las bases ya sembradas.                                                                    |
| D33 | La contraseña temporal la **genera el sistema** con `node:crypto`, cumple `contrasenaSchema` y se muestra **una sola vez** en un diálogo con botón de copiar. Nunca se guarda en claro, ni en logs, ni en la bitácora. Puerto `GENERADOR_CONTRASENA` con un comentario `ponytail:` (una implementación; existe para inyectar un valor conocido en pruebas).                                                                                                                                                                                              | El ADMIN no inventa ni reutiliza contraseñas.                                                                                                          |
| D34 | El cambio obligatorio de la temporal en el primer ingreso queda para HU-05 (S6), que lo extiende al personal. Se anota como deuda.                                                                                                                                                                                                                                                                                                                                                                                                                       | Regla de alcance.                                                                                                                                      |
| D35 | Endpoints de `usuarios`, todos `@Roles('ADMIN')`: `GET /usuarios` (lista solo cuentas ADMIN y OPERADOR, 20 por página, sin búsqueda); `POST /usuarios` → `{ usuario, contrasenaTemporal }`; `PATCH /usuarios/:id` con `{ nombre?, rol? }`; `POST /usuarios/:id/desactivar`, `/reactivar` y `/restablecer-contrasena` (este último → `{ contrasenaTemporal }`). Ninguna respuesta incluye `passwordHash`.                                                                                                                                                 | Un endpoint por acción auditada.                                                                                                                       |
| D36 | El correo no se edita (identidad de acceso y de la bitácora). El rol solo puede ser ADMIN u OPERADOR: crear o editar con CLIENTE → 400 por el esquema. Las cuentas CLIENTE no se listan ni se gestionan aquí (HU-05, S6); actuar sobre una por id → 404.                                                                                                                                                                                                                                                                                                 | HU-04 es "del personal".                                                                                                                               |
| D37 | Desactivar, cambiar el rol y restablecer la contraseña **cierran todas las sesiones** del usuario con `cerrarTodas(usuarioId)` (nuevo en `AlmacenSesionesPort`, `SCAN` de `sesion:<id>:*` + `DEL`). Orden: primero la base (impide nuevos inicios con el estado viejo) y luego Redis. Si Redis falla → 502 (`ErrorDependenciaExterna`); desactivar y cambiar el rol son idempotentes, así que reintentar cierra las sesiones.                                                                                                                            | Deuda de S3; el JWT lleva el rol y `JwtEstrategia` solo consulta Redis.                                                                                |
| D38 | Se puede reactivar. Protecciones (`ReglaNegocioError`, 422): el ADMIN no puede desactivarse, cambiarse el rol ni restablecerse la contraseña a sí mismo (usa `/cuenta/contrasena`); no se puede desactivar ni degradar al **último ADMIN activo**. El conteo y la escritura van en una `$transaction`; la carrera entre dos ADMIN simultáneos se acepta con un comentario `ponytail:`.                                                                                                                                                                   | Evita dejar el sistema sin administrador.                                                                                                              |
| D39 | Formato de error sin cambios (`statusCode, code, message, details, …`). Duplicados → `ConflictoError` (409) con `details: { campo, motivo }`, donde `motivo` es `CORREO_DUPLICADO`, `IDENTIFICACION_DUPLICADA` o `RUC_DUPLICADO`. Reglas de D38 → `ReglaNegocioError` con `details: { motivo: 'ULTIMO_ADMIN' \| 'AUTO_MODIFICACION' }`. Además de la comprobación previa, el repositorio traduce el `P2002` de Prisma al mismo 409.                                                                                                                      | La SPA pone el 409 en su campo; `AllExceptionsFilter` ya pasa `detalles` a `details`.                                                                  |
| D40 | **RN-11** en `@oasis/shared` (`validarIdentificacion` y `validarRuc`), usadas por `crearClienteSchema` y `actualizarClienteSchema` con `superRefine` y por los esquemas de aseguradora. Cédula: 10 dígitos, provincia 01–24 o 30, tercer dígito < 6 y verificador módulo 10. RUC: 13 dígitos, termina en `001`, provincia válida; tercer dígito 0–5 → los 10 primeros son una cédula válida; 6 o 9 → solo estructura, **sin módulo 11**. Pasaporte: 5–20 alfanuméricos, se normaliza a mayúsculas. Cédula y RUC: se quitan los espacios de los extremos. | El texto de RN-11 no está en el repo (ERS `.docx` sin versionar). El SRI emite RUC de sociedades que no cumplen el módulo 11 (comentario `ponytail:`). |
| D41 | ADR-017 "Validación de identificaciones ecuatorianas (RN-11)". El informe pide al autor agregarlo a la tabla 11-1.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Fija una regla de negocio que el backlog cita y el repo no define.                                                                                     |
| D42 | Se retiran `DELETE /clientes/:id` y `DELETE /aseguradoras/:id` con sus casos de uso, métodos de repositorio y referencias en pruebas. `ELIMINAR` sigue en `ACCIONES_AUDITORIA` (filas antiguas de la bitácora).                                                                                                                                                                                                                                                                                                                                          | RN-09 ("desactivar no elimina", HU-08); HU-11 solo pide listar y editar.                                                                               |
| D43 | Aseguradoras: `POST` y `PATCH` solo ADMIN; `GET` (lista y por id) ADMIN y OPERADOR, porque el operador las elige al registrar pólizas en S3. Clientes siguen ADMIN y OPERADOR.                                                                                                                                                                                                                                                                                                                                                                           | HU-11 dice "como administrador".                                                                                                                       |
| D44 | Acciones nuevas en `ACCIONES_AUDITORIA`: `DESACTIVAR`, `REACTIVAR` y `RESTABLECER_CONTRASENA`, con su etiqueta en `BitacoraPage`. Crear usuario → `CREAR`; editar → `MODIFICAR`.                                                                                                                                                                                                                                                                                                                                                                         | La bitácora (HU-45) filtra por acción.                                                                                                                 |
| D45 | HT-04 en la Etapa B: (1) auditar cada criterio con evidencia, existente o nueva; (2) corregir los 360 px en todas las pantallas, nuevas y existentes; (3) extraer solo lo que las tres páginas repiten de verdad (tabla paginada con carga, error y vacío). Sin dependencias nuevas salvo componentes shadcn que falten (`alert-dialog`).                                                                                                                                                                                                                | Casi todo HT-04 ya existe; no se crea una librería de componentes.                                                                                     |
| D46 | Páginas `/usuarios` (solo ADMIN, ícono `UserCog`) y `/aseguradoras` (ADMIN y OPERADOR; "Nueva" y "Editar" solo ADMIN, ícono `Building2`), con el patrón de `ClientesPage` (listado en `Card` y formulario en `Dialog`). En la barra lateral, después de Pólizas y antes de Bitácora. `ClientesPage`: formulario con RN-11, errores por campo, 409 en su campo y columna "Registrado" (`createdAt`).                                                                                                                                                      | `AGENTS.md`: página nueva → `router.tsx` con roles + enlace en `AppLayout`.                                                                            |
| D47 | Pruebas: TDD de RN-11, casos de uso de usuarios y `cerrarTodas`; e2e nuevos `usuarios`, `clientes` y `aseguradoras`, y matriz de `acceso-por-rol` actualizada; Vitest de las tres páginas; Playwright `personal.spec.ts` (flujo del personal) y `responsive.spec.ts` (360 px por rol), solo Chromium.                                                                                                                                                                                                                                                    | Evidencia por criterio para el informe.                                                                                                                |
| D48 | Las pruebas que crean clientes por el API usan identificaciones válidas generadas por un helper de prueba (`cedulaValida(semilla)`), no valores fijos que choquen entre corridas.                                                                                                                                                                                                                                                                                                                                                                        | Con RN-11, `E2E-<sufijo>` deja de ser válido.                                                                                                          |

## B3. Estado de partida (verificado el 06/10/2026)

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
- **Pruebas al cierre de la Etapa A:** 30 de contratos, 106 unitarias del API (23 suites), 58 de la
  SPA (8 archivos), 96 e2e del API (6 suites) y 4 de Playwright (solo Chromium).
- **Entorno (informe de S1 y Etapa A):**
  - `pnpm` es el binario de Windows aunque se invoque desde WSL: las variables exportadas en la
    shell no le llegan sin `WSLENV`.
  - Si Windows define `CONTRACT_ADDRESS`, esa variable pisa el `.env` local.
  - Antes de Playwright, limpia `bull:anclaje-recibos:*` si quedaron trabajos de otras corridas.
  - El nodo Hardhat puede ir nativo
    (`pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1`); API y worker se
    lanzan desde `dist` para Playwright.
  - El hook `pre-commit` falla en Windows con muchos archivos (línea de comandos demasiado larga):
    si pasa, verifica `lint` y `format:check` del monorepo y commitea con `--no-verify`, y anótalo.

## B4. Fase B0 — Preparación (0,5 h)

### T23. Rama y línea base

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

## B5. Fase B1 — Contratos compartidos (2 h)

### T24. Validadores de RN-11 (TDD, 1 h)

**Miniprompt.**

- **Objetivo:** HU-07.1 y la regla de RUC de HU-11 (D40).
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
- **Reglas exactas** (D40):
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

### T25. Esquemas, acciones de auditoría y RN-11 en los esquemas (1 h)

**Miniprompt.**

- **Objetivo:** contratos de HU-04, RN-11 en clientes y aseguradoras, y las acciones de D44.
- **`packages/shared/src/schemas/usuario.schema.ts` (nuevo):**
  - `ROLES_PERSONAL = ['ADMIN', 'OPERADOR'] as const` y `rolPersonalSchema`;
  - `crearUsuarioSchema`: `email` (`z.email`, normalizado a minúsculas y sin espacios), `nombre`
    (2–120, `trim`) y `rol: rolPersonalSchema`;
  - `actualizarUsuarioSchema`: `nombre?` y `rol?`, con al menos un campo, igual que
    `actualizarClienteSchema`; `.strict()`, para que mandar `email` dé 400 y el correo no se edite
    (D36);
  - `usuarioSchema` (respuesta: `id`, `email`, `nombre`, `rol`, `activo`, `createdAt`, `updatedAt`,
    sin `clienteId` ni hash);
  - `usuarioCreadoSchema = { usuario, contrasenaTemporal }` y `contrasenaTemporalSchema =
{ contrasenaTemporal }`.
- **`cliente.schema.ts`:**
  - aplica `normalizarIdentificacion` con `transform` o `preprocess` y `validarIdentificacion` en un
    `superRefine` sobre `identificacion`, con el mensaje en `path: ['identificacion']`;
  - en `actualizarClienteSchema`, valida solo si llegan `tipoIdentificacion` e `identificacion`
    juntos. Si llega solo uno, el caso de uso valida contra el valor guardado (T30);
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

### Verificación de la Fase B1

`pnpm --filter @oasis/shared build && pnpm -r typecheck && pnpm --filter @oasis/web test`.

## B6. Fase B2 — Usuarios del personal en el API (HU-04; 4 h)

### T26. Migración `nombre`, seed y lectura en auth (1 h)

**Miniprompt.**

- **Objetivo:** D32.
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

### T27. `cerrarTodas` en el almacén de sesiones (TDD, 0,75 h)

**Miniprompt.**

- **Objetivo:** D37, pendiente de la Etapa A.
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

### T28. Casos de uso de usuarios (TDD, 1,5 h)

**Miniprompt.**

- **Objetivo:** HU-04.1, HU-04.2, HU-04.3 (servidor) y HU-04.4, con D33 y D35 a D39.
- **Archivos en `apps/api/src/modules/usuarios/`:**
  - `domain/usuario.ts`: agrega `nombre`;
  - `application/ports/usuarios.repository.port.ts`: `crear`, `buscarPorId` (solo personal),
    `existeCorreo`, `actualizar`, `cambiarActivo`, `cambiarHash` y `contarAdminsActivos`, más una
    operación transaccional para las reglas de D38 (ver ejemplo);
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

### T29. Controlador y módulo (0,75 h)

**Miniprompt.**

- **Objetivo:** exponer D35.
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

### Verificación de la Fase B2

`pnpm --filter @oasis/api build && pnpm --filter @oasis/api test && pnpm deps:check`.

## B7. Fase B3 — Clientes y aseguradoras en el API (HU-07, HU-11; 2,5 h)

### T30. Clientes: RN-11, 409 por campo y retiro de `DELETE` (1,25 h)

**Miniprompt.**

- **Objetivo:** HU-07.1, HU-07.2 y HU-07.4, con D39, D40 y D42.
- **Archivos:** `clientes.controller.ts`, `clientes.use-cases.ts`, `clientes.module.ts`, el puerto
  y el repositorio de clientes, y `apps/api/test/bitacora.e2e-spec.ts`.
- **Comportamiento:**
  - `crearClienteSchema` ya valida RN-11 (T25), así que el `ZodBody` devuelve 400 `VALIDACION` con el
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
  una cédula válida de `cedulaValida` (D48). La prueba de que la bitácora no se borra (trigger) no
  cambia.
- **Pruebas primero** (unitarias del caso de uso):
  - "rechaza una identificación duplicada con 409 en el campo identificacion";
  - "rechaza cambiar el tipo a RUC si la identificación guardada es una cédula".
- **Verificación:** `pnpm --filter @oasis/api test clientes`.

### T31. Aseguradoras: permisos, RUC y retiro de `DELETE` (1,25 h)

**Miniprompt.**

- **Objetivo:** HU-11.1 a HU-11.4, con D39, D40, D42 y D43.
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

### Verificación de la Fase B3

`pnpm --filter @oasis/api build && pnpm --filter @oasis/api test && pnpm deps:check`.

## B8. Fase B4 — Base del frontend (HT-04; 4 h)

### T32. Auditoría de HT-04 y 360 px (2,5 h)

**Miniprompt.**

- **Objetivo:** HT-04, criterios 1 a 6, con D45.
- **Paso 1, inventario:** arma en el ledger una tabla criterio → evidencia actual (archivo de prueba
  y caso), que irá al informe. Lo esperado:
  - criterio 1: `AppLayout.test.tsx`; agrega "muestra el nombre del usuario en el encabezado" si
    falta, ahora con el `nombre` real;
  - criterio 2: `AppLayout.test.tsx` y `sesion.spec.ts`;
  - criterio 3: `api-client.test.ts`;
  - criterio 4: `Providers.tsx` y las pruebas de formularios con RHF y Zod;
  - criterio 5: `responsive.spec.ts` (T38);
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

### T33. Tabla paginada compartida y `alert-dialog` (1,5 h)

**Miniprompt.**

- **Objetivo:** D45, punto 3, y la confirmación de D46.
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

### Verificación de la Fase B4

`pnpm --filter @oasis/web lint && pnpm --filter @oasis/web typecheck && pnpm --filter @oasis/web test`.

## B9. Fase B5 — Páginas (HU-04, HU-07, HU-11; 5 h)

### T34. `UsuariosPage` (2 h)

**Miniprompt.**

- **Objetivo:** HU-04 en la SPA, con D33, D35, D36, D38, D39 y D46.
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

### T35. `AseguradorasPage` (1,25 h)

**Miniprompt.**

- **Objetivo:** HU-11.1 a HU-11.3 en la SPA, con D43 y D46.
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
- Si `features/polizas/api.ts` tiene su propio `aseguradoras()`, déjalo: pólizas es de S3.
- **Pruebas primero:**
  - "el operador ve el listado sin el botón Nueva";
  - "el administrador edita el nombre de una aseguradora";
  - "muestra RUC duplicado en el campo".

### T36. `ClientesPage`: RN-11 y fecha de creación (1,75 h)

**Miniprompt.**

- **Objetivo:** HU-07.1 a HU-07.4 en la SPA, con D46.
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
- **No** agregues edición, desactivación, búsqueda ni filtros (HU-08 y HU-09, S3).
- **Pruebas primero:**
  - "muestra el error de cédula inválida";
  - "cambia los campos de nombre al elegir RUC";
  - "marca los obligatorios vacíos";
  - "muestra identificación duplicada en el campo";
  - "muestra la fecha de registro".

### Verificación de la Fase B5

`pnpm --filter @oasis/web lint && pnpm --filter @oasis/web typecheck && pnpm --filter @oasis/web test`,
la revisión visual a 360 px de las tres páginas y una pasada con el teclado.

## B10. Fase B6 — Evidencia e2e (4 h)

Helper común: `apps/api/test/identificaciones.ts` con `cedulaValida(semilla: number)`, que devuelve
una cédula de provincia 17 con el verificador calculado y es única por semilla (usa `Date.now()` o
un contador), y `rucSociedad(semilla)` (`179` + 7 dígitos + `001`). Playwright usa una copia mínima
en `apps/web/e2e/` (no importa archivos de `apps/api`).

### T37. e2e del API (2,5 h)

**Miniprompt.**

- **Objetivo:** un caso por criterio de HU-04, HU-07 y HU-11. Crea la app como las suites
  existentes (`cookieParser`, prefijo y `trust proxy`), con su `X-Forwarded-For` por caso.
- **`apps/api/test/usuarios.e2e-spec.ts`:**
  1. ADMIN crea un operador → 201 con `contrasenaTemporal`, sin `passwordHash`; el operador inicia
     sesión con ella (HU-04.1).
  2. Correo repetido → 409 con `details.campo = 'email'` (HU-04.2).
  3. Crear con rol CLIENTE → 400.
  4. Desactivar: la sesión abierta del operador recibe 401 en su siguiente petición y el login con
     su contraseña responde 401 genérico (HU-04.3 y el pendiente de la Etapa A).
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
  4. OPERADOR lista → 200; crea o edita → 403 (D43).
  5. RUC de 12 dígitos → 400.
- **`acceso-por-rol.e2e-spec.ts`:** la matriz descubre las rutas sola. Ajusta lo que espera de las
  rutas nuevas (usuarios solo ADMIN; escritura de aseguradoras solo ADMIN) y cambia el
  `E2E-<sufijo>` por `cedulaValida` si crea clientes por el API.
- **Verificación:** `pnpm test:e2e` con la infraestructura arriba. Las 9 suites en verde.

### T38. Playwright (1,5 h)

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

### Verificación de la Fase B6

`pnpm test:e2e && pnpm --filter @oasis/web test:e2e`.

## B11. Fase B7 — Documentación y cierre (3 h)

### T39. ADR-017 y documentación (1 h)

**Miniprompt.**

`docs/adr/ADR-017-validacion-identificaciones.md` (nuevo), con este contenido:

```markdown
# ADR-017 · Validación de identificaciones ecuatorianas (RN-11)

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S2

## Contexto

HU-07 exige validar la cédula, el RUC y el pasaporte del cliente "según RN-11", pero el texto de esa
regla vive en el ERS `.docx`, que no está en el repositorio; hasta S2 el esquema solo comprobaba una
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
(RN-11) | S2 | ADR-017-validacion-identificaciones.md |`, con el formato de las demás.

- **`CLAUDE.md`:**
  - en "Sesiones (ADR-016)", agrega `cerrarTodas` (desactivar, cambiar el rol y restablecer);
  - en "Configuración y datos", nota que `Usuario.nombre` es una columna;
  - en "Pruebas", agrega `cedulaValida` (`test/identificaciones.ts`) para crear clientes por el API.
- **`apps/api/src/modules/README.md`:** si lista rutas o exenciones, agrega usuarios y las acciones
  nuevas; anota que `aseguradoras` declara `@Roles` por handler.
- **`AGENTS.md`:** solo si alguna regla cambió; no se espera.
- **`README.md`:** si describe pantallas o usuarios del seed, agrega Usuarios y Aseguradoras.

## B12. Cierre (2 h)

### B12.1 Definición de Terminado

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

### B12.2 Informe del sprint

Escribe la Etapa B del informe `docs/sprints/sprint-s2.md`, con la estructura de la Etapa A:

1. **Encabezado:** historias, épicas (EP-07, EP-01, EP-02 y EP-03), rama, fechas y estado.
2. **Objetivo.**
3. **Entregables:** tabla con su ubicación.
4. **Criterios de cada historia con su evidencia** (sección B14).
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
     (HU-05, S6);
   - HU-08 y HU-09 (S3);
   - CLIENTE en la verificación (S5);
   - recuperación de contraseña (S7);
   - Firefox y WebKit (S8);
   - la carrera del último ADMIN (`ponytail:`).
10. **Acciones del autor:** agregar ADR-017 a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md` y
    confirmar el texto de RN-11 contra el ERS.
11. **Pruebas manuales** y **Cómo verificar** (los comandos de B12.1).

## B13. Commit y entrega

Revisa con `git status` que no entren `.env`, `.claude/`, `.superpowers/`, `*.docx`,
`ignition/deployments/chain-31337` ni artefactos. Comprueba `git config user.name`
(`JohannCaizaguano`). Haz un solo commit, **sin** líneas `Co-Authored-By` ni "Generated with":

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar la etapa B del sprint S2 con usuarios del personal, clientes y aseguradoras

- HT-04: auditoría de la base de la SPA, 360 px en todas las pantallas, tabla paginada y
  alert-dialog.
- HU-04: alta con contraseña temporal generada, edición de nombre y rol, desactivar y reactivar,
  restablecer contraseña; cierre de todas las sesiones y protección del último administrador.
- HU-07: RN-11 para cédula, RUC y pasaporte, 409 por campo y fecha de registro.
- HU-11: aseguradoras con RUC validado, escritura solo para ADMIN y edición.
- Se retira DELETE de clientes y aseguradoras (RN-09); migración usuario_nombre.
- Docs: ADR-017, CLAUDE.md, plan e informe de la etapa B del S2.

Refs: HT-04, HU-04, HU-07, HU-11
EOF
```

No hagas push. Termina con un mensaje al usuario que incluya:

- el resumen de la verificación de B12.1 y de las pruebas manuales;
- el recordatorio de agregar ADR-017 a la tabla 11-1 y de confirmar RN-11 contra el ERS;
- el título del PR (el encabezado del commit);
- este cuerpo de PR, listo para pegar y sin líneas de atribución:

```markdown
## Resumen

S2, Etapa B: base de la SPA auditada y adaptada a 360 px (HT-04), gestión de usuarios del personal
con cierre de sesiones (HU-04), registro de clientes con RN-11 (HU-07) y catálogo de aseguradoras
(HU-11). Informe: `docs/sprints/sprint-s2.md`.

## Criterios de aceptación

- [x] HT-04: layout y sonner; rutas por rol; renovación ante 401; Query y RHF + Zod; 360 px; login
- [x] HU-04: alta con temporal; correo único; desactivado sin acceso; restablecer contraseña
- [x] HU-07: RN-11; duplicado con mensaje claro; obligatorios; fecha de creación
- [x] HU-11: nombre y RUC; RUC duplicado; listar y editar; sin cuenta ni acceso

## Pendiente

- Agregar ADR-017 a la tabla 11-1 de la arquitectura y confirmar RN-11 contra el ERS.
- Aceptación del Product Owner en la revisión del sprint.
```

## B14. Trazabilidad criterio → evidencia

| Criterio                                                  | Evidencia                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| HT-04.1 layout, usuario y sonner                          | `AppLayout.test.tsx`; pruebas de las páginas con `toast`                                                     |
| HT-04.2 rutas por rol                                     | `AppLayout.test.tsx`; `sesion.spec.ts`; pruebas manuales del OPERADOR                                        |
| HT-04.3 renovación ante 401                               | `api-client.test.ts`                                                                                         |
| HT-04.4 TanStack Query y RHF + Zod                        | `Providers.tsx`; pruebas de `FormularioUsuario`, `FormularioAseguradora` y `FormularioCliente`               |
| HT-04.5 desde 360 px                                      | `responsive.spec.ts`                                                                                         |
| HT-04.6 login de extremo a extremo                        | `flujo-completo.spec.ts`; `personal.spec.ts`                                                                 |
| HU-04.1 alta con correo, nombre, rol y temporal           | `crear-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 1; `UsuariosPage.test.tsx`; `personal.spec.ts` |
| HU-04.2 correo único                                      | `crear-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 2; `UsuariosPage.test.tsx`                     |
| HU-04.3 desactivado sin acceso                            | `desactivar-usuario.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 4; `personal.spec.ts`                     |
| HU-04.4 restablecer contraseña                            | `restablecer-contrasena.use-case.spec.ts`; `usuarios.e2e-spec.ts` caso 6                                     |
| HU-07.1 RN-11                                             | `identificacion.spec.ts`; `clientes.e2e-spec.ts` casos 1 y 2; `FormularioCliente.test.tsx`; ADR-017          |
| HU-07.2 duplicado con mensaje claro                       | `clientes.use-cases` spec; `clientes.e2e-spec.ts` caso 3; `ClientesPage.test.tsx`; `personal.spec.ts`        |
| HU-07.3 obligatorios con mensaje                          | `esquemas-compartidos.spec.ts`; `clientes.e2e-spec.ts` caso 4; `FormularioCliente.test.tsx`                  |
| HU-07.4 fecha de creación                                 | `clientes.e2e-spec.ts` caso 1; `ClientesPage.test.tsx`                                                       |
| HU-11.1 nombre y RUC de 13 dígitos                        | `aseguradoras.e2e-spec.ts` casos 1 y 5; `identificacion.spec.ts`                                             |
| HU-11.2 RUC duplicado                                     | `aseguradoras.use-cases` spec; `aseguradoras.e2e-spec.ts` caso 2                                             |
| HU-11.3 listar y editar                                   | `aseguradoras.e2e-spec.ts` caso 3; `AseguradorasPage.test.tsx`                                               |
| HU-11.4 sin cuenta ni acceso                              | `schema.prisma` (sin relación con `Usuario` ni rol propio); `aseguradoras.e2e-spec.ts` caso 4                |
| Pendiente de la Etapa A: cierre de sesiones al desactivar | `redis-almacen-sesiones.adapter.spec.ts`; `usuarios.e2e-spec.ts` casos 4, 6 y 7                              |

## B15. Estimación

| Fase | Tareas                                                   | Historia            |  Horas |
| ---- | -------------------------------------------------------- | ------------------- | -----: |
| B0   | Rama y línea base (T23)                                  | HT-04               |    0,5 |
| B1   | RN-11, esquemas y acciones (T24 y T25)                   | HU-07, HU-04, HU-11 |      2 |
| B2   | Usuarios en el API (T26 a T29)                           | HU-04               |      4 |
| B3   | Clientes y aseguradoras en el API (T30 y T31)            | HU-07, HU-11        |    2,5 |
| B4   | Base del frontend y 360 px (T32 y T33)                   | HT-04               |      4 |
| B5   | Páginas de usuarios, aseguradoras y clientes (T34 a T36) | HU-04, HU-11, HU-07 |      5 |
| B6   | e2e del API y Playwright (T37 y T38)                     | Todas               |      4 |
| B7   | ADR, documentación, DoD, informe y commit (T39 y B12)    | Todas               |      3 |
|      | **Total**                                                |                     | **25** |

En el informe, las horas por historia siguen el backlog: HT-04 10 h, HU-04 5 h, HU-07 6 h y HU-11
4 h. La etapa usa sus 25 h sin reserva: si falta tiempo, recorta primero T33 (la
extracción de la tabla es opcional según su propio criterio) y la búsqueda de `AseguradorasPage`.
