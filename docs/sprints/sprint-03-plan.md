# Sprint 3 — Plan de implementación

- **Historias:** HU-01 Iniciar sesión (8 h), HU-02 Cerrar sesión (3 h), HU-03 Control de acceso por
  rol (6 h), HU-06 Cambiar contraseña (3 h) y HU-32 Cierre de sesión por inactividad (2 h): 22 de 25
  horas de capacidad.
- **Fechas:** 21/09/2026 – 25/09/2026 (tabla 6-1 del backlog).
- **Rama:** `feat/sprint-03-acceso-sesiones`.
- **Ejecuta:** agente local (OpenCode) sobre esta copia del repositorio.
- **Decisiones acordadas con el desarrollador:** 06/10/2026 (sección 2).

Este documento es el Sprint Backlog del Sprint 3. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.
OpenCode solo carga `AGENTS.md`: lee los otros dos antes de empezar. La fuente de verdad está en
`docs/referencia/`, que no se edita. Si algo de este plan contradice `docs/referencia/`, gana la
referencia: detente y repórtalo.

## 0. Reglas de ejecución

1. Ejecuta las fases en orden: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.
2. TDD en toda lógica nueva: primero la prueba en rojo y luego el código (`test-driven-development`).
   Antes de cerrar una fase usa `verification-before-completion` y guarda la salida para el informe.
3. Al empezar cada fase, invoca las skills de su fila en la tabla de la sección 0.1, en el orden de
   `AGENTS.md`: skill de proceso → skill de la tecnología → ponytail decide el tamaño.
4. Tras cambiar `packages/shared/src`, ejecuta `pnpm --filter @oasis/shared build` para que el API y
   la SPA vean el cambio, y borra `apps/web/node_modules/.vite`: Vite no invalida el prebundle de un
   paquete del workspace cuando cambia su `dist` (informe de S2, §9).
5. El árbol de trabajo ya trae la actualización de alcance del 06/10 (sección 3). **No la descartes
   ni la guardes con `stash`**: entra en el commit del sprint. Nunca edites `docs/referencia/`.
6. **Un solo commit** al final (sección 13). **No hagas push ni abras el PR**: los hace el usuario.
7. No adelantes trabajo de otros sprints; lo que quede fuera de alcance se anota como deuda en el
   informe (sección 12.2).
8. Comentarios solo para el porqué no obvio y en español (`AGENTS.md`). Las simplificaciones
   deliberadas llevan un comentario `ponytail:` con el techo y la salida.

### 0.1 Skills por fase

| Momento                               | Skills                                                                                                                   | Para qué                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Todo el sprint                        | `executing-plans`, `ponytail`                                                                                            | Seguir el plan fase por fase con el diff más corto que funcione.                    |
| Toda lógica nueva                     | `test-driven-development`                                                                                                | Prueba en rojo antes del código.                                                    |
| Un fallo o una prueba roja inesperada | `systematic-debugging`                                                                                                   | Causa raíz antes de cambiar código.                                                 |
| Cierre de cada fase                   | `verification-before-completion`                                                                                         | Evidencia (salida de los comandos) antes de declarar la fase terminada.             |
| Fase 1 (T1)                           | `zod`, `typescript-advanced-types`                                                                                       | Esquemas compartidos con `refine` y tipos inferidos.                                |
| Fase 2 (T2 a T7)                      | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`                                              | Estrategia JWT, guards, interceptores, Redis y async.                               |
| Fase 3, API (T8 a T11)                | `nestjs-best-practices`, `typescript-advanced-types`                                                                     | Guard por defecto, descubrimiento de rutas por metadata, controlador y caso de uso. |
| Fase 3, SPA (T12)                     | `react-best-practices`, `shadcn`, `tailwind-v4-shadcn`, `tailwind-css-patterns`, `impeccable`, `accessibility`, `vitest` | Rutas, menú por rol, página de verificación, tarjeta del QR y sus pruebas.          |
| Fase 4, API (T14)                     | `nestjs-best-practices`, `prisma-client-api`, `zod`                                                                      | Caso de uso, repositorio y endpoint del cambio de contraseña.                       |
| Fase 4, SPA (T15)                     | `react-hook-form`, `zod`, `react-best-practices`, `shadcn`, `impeccable`, `frontend-design`, `accessibility`, `vitest`   | Página `/cuenta/contrasena` y sus pruebas.                                          |
| Fase 5 (T16 y T17)                    | `react-best-practices`, `shadcn`, `impeccable`, `frontend-design`, `accessibility`, `vitest`                             | Store, api-client, hook de inactividad, aviso y aviso del login.                    |
| Fase 6, API (T18 y T19)               | `nestjs-best-practices`, `prisma-client-api`                                                                             | e2e con Supertest y datos de prueba creados con Prisma.                             |
| Fase 6, SPA (T20)                     | `playwright-best-practices`                                                                                              | `page.clock`, cabeceras por prueba y navegación atrás.                              |
| Fase 8 (cierre)                       | `ponytail-review`, `verification-before-completion`                                                                      | Revisar el diff completo y ejecutar la Definición de Terminado.                     |
| Si Vite sirve un prebundle viejo      | `vite`                                                                                                                   | Caché de `optimizeDeps` tras recompilar `@oasis/shared`.                            |

No aplican: `brainstorming` y `writing-plans` (el diseño y el plan ya están acordados), `prisma-cli`
(no hay migraciones), `bash-defensive-patterns` (no hay scripts bash nuevos) y `seo`. T13 (k6) y la
Fase 7 (documentación) siguen las reglas de `AGENTS.md` sin skill propia.

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
- Su ledger vive en `.superpowers/sdd/sprint-03-plan/`, que ya está en `.gitignore`.
- Sin commits por tarea: el único commit es el de la sección 13.
- Las decisiones de la sección 2 no se reabren con un "ruling". Si una deja de ser viable, detente y
  pregunta; los demás desvíos menores van al ledger y al informe como discrepancias.
- Al terminar, si `finishing-a-development-branch` ofrece opciones, elige "conservar la rama tal
  cual": sin merge, push ni PR.

## 1. Alcance

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
  consultas por minuto por usuario (RNF-12) y presentación de resultados de HU-28 (S8).
- Recuperación de contraseña (HU-31, S13): figura en la lista de rutas públicas de ADR-015, pero aún
  no existe.
- Gestión de usuarios y cierre de sesiones al desactivar una cuenta (HU-04, S4); cambio obligatorio
  de la contraseña temporal (HU-05, S10).
- `TransaccionPagoLinea` y pago en línea (HU-48, S12).
- Desborde a 360 px de `/`, `/pagos` y `/recibos` (HT-04, S4).
- Firefox y WebKit en Playwright (HT-09, S15).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Motivo                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Plan con el formato de S2, ejecutado por OpenCode; un solo commit; push y PR los hace el usuario.                                                                                                                                                                                                                                                                                                                                                                                                                                               | `AGENTS.md` y preferencia del usuario. OpenCode trae superpowers, ponytail e `impeccable`.                                                        |
| D2  | El commit incluye la actualización de alcance del 06/10 que está sin commitear (backlog v1.1, arquitectura v1.3, ADR-014, ADR-015, `AGENTS.md`, `CLAUDE.md`, `README.md`, ADR y fichas modificadas).                                                                                                                                                                                                                                                                                                                                            | Decisión del desarrollador.                                                                                                                       |
| D3  | El plan usa las fechas del backlog (21–25/09/2026).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Decisión del desarrollador.                                                                                                                       |
| D4  | Regla de acceso de ADR-015 en S3: se retira `VerificacionPublicaController`; la verificación pasa a `GET /api/v1/recibos/:codigo/verificacion`, solo para ADMIN y OPERADOR; la SPA la sirve en `/recibos/verificar` y `/recibos/verificar/:codigo`, protegidas, y el QR apunta ahí. El CLIENTE y el límite por usuario llegan en S8.                                                                                                                                                                                                            | HU-03 (criterio 1) sin excepciones y una sola regla de acceso desde ahora; solo se adelanta, para el personal, el criterio 1 de HU-28.            |
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
| D24 | `infra/k6/verificacion-publica.js` pasa a `verificacion-recibo.js`, con sesión. Se elimina `THROTTLE_VERIFICACION_PUBLICA_LIMIT`; hasta S8 rige el límite global por IP.                                                                                                                                                                                                                                                                                                                                                                        | ADR-015 pide un escenario autenticado.                                                                                                            |
| D25 | Pruebas: la app e2e activa `trust proxy` y cada caso envía su `X-Forwarded-For`; Playwright hace lo mismo con `page.setExtraHTTPHeaders`. Las pruebas que cambian contraseñas crean su usuario: el seed no las restablece.                                                                                                                                                                                                                                                                                                                      | Sin IP propia, el límite de 5 inicios por minuto cruza pruebas. El `upsert` del seed usa `update: {}`.                                            |
| D26 | Playwright solo para lo que necesita navegador (volver atrás tras logout, inactividad con `page.clock`) y solo en Chromium. HU-06 se prueba con e2e del API y Vitest.                                                                                                                                                                                                                                                                                                                                                                           | Los tres motores son de HT-09 (S15).                                                                                                              |
| D27 | Documentación: ADR-016 nuevo y ADR-015 enmendado. `CLAUDE.md` queda solo con el mapa técnico; sus reglas pasan a `AGENTS.md` o a `apps/api/src/modules/README.md`. `AGENTS.md` remite a `CLAUDE.md`. El autor agrega ADR-016 a la tabla 11-1.                                                                                                                                                                                                                                                                                                   | OpenCode no carga `CLAUDE.md`; `docs/referencia/` no se edita.                                                                                    |
| D28 | `TransaccionPagoLinea` llega en S12; en S3 solo se corrige `CLAUDE.md` y se reporta.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Regla de alcance; sus campos se fijan contra el entorno de pruebas de PayPhone.                                                                   |
| D29 | Horas: el retiro de la verificación pública se imputa a HU-03; el modelo de sesiones, a HU-01 (criterio 4), HU-02 y HU-06.                                                                                                                                                                                                                                                                                                                                                                                                                      | Trazabilidad del informe.                                                                                                                         |

## 3. Estado de partida (verificado el 06/10/2026)

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
- Pruebas según el informe de S2: 30 de contratos, 76 unitarias del API, 36 de la SPA, 17 e2e del
  API (4 suites) y 1 de Playwright (solo Chromium).
- **Árbol de trabajo:** 13 archivos modificados y 2 ADR nuevos con la actualización de alcance del
  06/10. `README.md` no pasa Prettier por dos líneas en blanco sobrantes.
- OpenCode solo carga `AGENTS.md`. `impeccable` está en `.agents/skills`; superpowers y ponytail son
  plugins de OpenCode.
- El ERS `.docx` de `docs/` está desactualizado (RF-33 todavía dice "página pública"; no tiene
  RF-36 en adelante). Manda el backlog.
- **Entorno (informe de S2, §9):**
  - `pnpm` es el binario de Windows aunque se invoque desde WSL: las variables exportadas en la
    shell no le llegan sin `WSLENV`.
  - Si Windows define `CONTRACT_ADDRESS`, esa variable pisa el `.env` local.
  - Antes de Playwright, limpia `bull:anclaje-recibos:*` si quedaron trabajos de otras corridas.
  - En Windows, el watcher del worker de `pnpm dev` puede fallar con EPERM; los e2e y Playwright
    arrancan el worker desde `dist`.

## 4. Fase 0 — Preparación (0,5 h)

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

## 5. Fase 1 — Contratos compartidos (0,5 h)

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

## 6. Fase 2 — Sesiones por familia (HU-01, HU-02; 3,5 h)

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

### Verificación de la Fase 2

```bash
pnpm --filter @oasis/api test && pnpm --filter @oasis/api typecheck && pnpm deps:check
```

## 7. Fase 3 — Acceso por rol y verificación con sesión (HU-03; 5 h)

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
// Escenario k6: verificación de recibos con sesión (ADR-015). Hasta S8 rige el límite global por
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

### Verificación de la Fase 3

```bash
pnpm --filter @oasis/shared build
pnpm --filter @oasis/api test && pnpm --filter @oasis/web test
pnpm -r typecheck && pnpm -r lint && pnpm deps:check
grep -rn "public/recibos\|verificacionPublica\|VerificacionPublica\|THROTTLE_VERIFICACION" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=generated \
  apps packages infra .env.example docs/despliegue.md   # sin resultados
```

## 8. Fase 4 — Cambiar contraseña (HU-06; 2,5 h)

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

## 9. Fase 5 — Cierre por inactividad (HU-32; 2,5 h)

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

## 10. Fase 6 — Evidencia e2e (3 h)

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
   defecto de la sección 3).
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

### Verificación de la Fase 6

Con la infraestructura arriba (sección 12.1): `pnpm test:e2e` y `pnpm --filter @oasis/web test:e2e`.

## 11. Fase 7 — Documentación (1,5 h)

### T21. ADR-016 y ADR-015

`docs/adr/ADR-016-sesiones-redis.md` (nuevo):

```markdown
# ADR-016 · Sesiones por familia de rotación con cierre por inactividad en Redis

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: 3

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

- Estado: "aceptado (S3: regla de acceso; S8: verificación del cliente)"; Sprint: "3 y 8".
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
  En S3 la usan ADMIN y OPERADOR; en S8 (HU-28) se abre al CLIENTE solo para sus recibos (RN-07): un
  recibo ajeno responde "No encontrado", y el límite es de 30 consultas por minuto por usuario
  (RNF-12).
- El QR del recibo apunta a `/recibos/verificar/:codigo` en la SPA, que pide iniciar sesión si no
  hay sesión activa.
- Se retiran `VerificacionPublicaController`, la ruta `public/`, `THROTTLE_VERIFICACION_PUBLICA_LIMIT`
  y el escenario k6 `verificacion-publica.js`, que se reemplaza por `verificacion-recibo.js`.
```

- En "Consecuencias", negativas, agrega: "Entre S3 y S8 el CLIENTE no puede verificar recibos; no
  hay clientes reales hasta el despliegue (S13)".
- En `docs/adr/README.md`, ADR-015 pasa a "S3 y S8" y se agrega la fila de ADR-016 (S3,
  `ADR-016-sesiones-redis.md`).

### T22. `CLAUDE.md`, `AGENTS.md`, reglas del API, README y fichas

`CLAUDE.md` queda solo con el mapa técnico (D27):

1. **"Hash y privacidad" (L30–36):** reemplaza la frase "Hoy vive en … la migración se hace con
   HU-28" por: "La verificación (`GET /api/v1/recibos/:codigo/verificacion`) recalcula el hash desde
   la base y lo compara con `verificar()`; los resultados posibles están en `ESTADOS_VERIFICACION`
   de `@oasis/shared`. Hoy es solo del personal; HU-28 (S8) la abre al CLIENTE para sus recibos,
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
   `TransaccionPagoLinea` (ADR-014), que llega con HU-48 en S12…".
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
  (`GET /api/v1/recibos/:codigo/verificacion`), por ahora solo para el personal; HU-28 (S8) la abre
  al CLIENTE para sus recibos".
- **`docs/arquitectura/c4-contenedores.md` (L27 y L47):** "refresh tokens (rotación)" pasa a
  "sesiones por familia con inactividad (ADR-016)".

## 12. Fase 8 — Cierre (1,5 h)

### 12.1 Definición de Terminado

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

### 12.2 Informe del sprint

Crea `docs/sprints/sprint-03.md` con la estructura de `sprint-02.md`:

1. **Encabezado:** historias, épica (EP-01), rama, fechas y estado.
2. **Objetivo.**
3. **Entregables:** tabla con su ubicación.
4. **Criterios de cada historia con su evidencia** (sección 14).
5. **Definición de Terminado:** tabla de estado.
6. **Versiones:** solo cambian si se actualizó alguna dependencia; ninguna es necesaria.
7. **Decisiones y discrepancias:**
   - ADR-015 enmendado y ADR-016.
   - El ERS `.docx` está desactualizado (RF-33 "página pública"; RNF-12 "verificación pública 30";
     sin RF-36 en adelante); manda el backlog.
   - `THROTTLE_VERIFICACION_PUBLICA_LIMIT` valía 20 y RNF-12 pide 30; se elimina y el límite por
     usuario llega en S8.
   - La tabla 6-1 de la arquitectura dice NestJS 12; se usa 11 (S1).
   - ADR-010 asume el modelo completo, pero `TransaccionPagoLinea` llega en S12.
   - La lista literal de rutas públicas de ADR-015 no incluía logout ni `/metrics`; se enmendó.
   - ADR-015 y `CLAUDE.md` situaban la migración de la verificación en S8; la regla de acceso se
     adelantó a S3.
8. **Impedimentos y observaciones:** incluye que las sesiones abiertas antes de S3 no traen `sid` y
   piden iniciar sesión una vez.
9. **Deuda y fuera de alcance:**
   - CLIENTE en la verificación y límite por usuario (S8);
   - cierre de sesiones al desactivar un usuario (HU-04, S4);
   - cambio obligatorio de la contraseña temporal (HU-05, S10);
   - recuperación de contraseña (HU-31, S13);
   - desborde a 360 px (S4);
   - Firefox y WebKit (S15).
10. **Acciones del autor:** agregar ADR-016 a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md`.
11. **Cómo verificar:** los comandos de 12.1.

## 13. Commit y entrega

Revisa con `git status` que no entren `.env`, `.claude/`, `*.docx`, `ignition/deployments/chain-31337`
ni artefactos, y que sí estén los documentos de la actualización de alcance. Haz un solo commit:

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint 3 con acceso por rol, sesiones y cambio de contraseña

- Alcance: backlog v1.1, arquitectura v1.3, ADR-014 y ADR-015 (actualización del 06/10).
- HU-01 y HU-02: sesiones por familia en Redis con revocación inmediata, 7 días absolutos,
  refresco serializado entre pestañas, no-store y 429 en español.
- HU-03: RolesGuard niega por defecto, cobertura de @Roles, matriz e2e de 401 y 403, RN-07 de
  mis-pagos en un caso de uso y verificación de recibos con sesión (ADR-015).
- HU-06: POST /auth/cambiar-contrasena y página /cuenta/contrasena.
- HU-32: aviso a los 29 minutos y cierre a los 30, compartido entre pestañas.
- Docs: ADR-015 enmendado, ADR-016, AGENTS.md, CLAUDE.md, plan e informe del sprint 3.

Refs: HU-01, HU-02, HU-03, HU-06, HU-32
EOF
```

No hagas push. Termina con un mensaje al usuario que incluya:

- el resumen de la verificación de 12.1 y de las pruebas manuales;
- el recordatorio de agregar ADR-016 a la tabla 11-1;
- el título del PR (el encabezado del commit);
- este cuerpo de PR, listo para pegar:

```markdown
## Resumen

Sprint 3: inicio y cierre de sesión con sesiones por familia (HU-01, HU-02), control de acceso por
rol con la regla de ADR-015 (HU-03), cambio de contraseña (HU-06) y cierre por inactividad (HU-32).
Incluye la actualización de alcance del 06/10. Informe: `docs/sprints/sprint-03.md`.

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

## 14. Trazabilidad criterio → evidencia

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

## 15. Estimación

| Fase | Tareas                                              | Historia     |  Horas |
| ---- | --------------------------------------------------- | ------------ | -----: |
| 0    | Rama y línea base (T0)                              | HU-01        |    0,5 |
| 1    | Contratos compartidos (T1)                          | HU-06, HU-32 |    0,5 |
| 2    | Sesiones por familia, `no-store` y 429 (T2 a T7)    | HU-01, HU-02 |    3,5 |
| 3    | Acceso por rol y verificación con sesión (T8 a T13) | HU-03        |      5 |
| 4    | Cambiar contraseña (T14 y T15)                      | HU-06        |    2,5 |
| 5    | Cierre por inactividad (T16 y T17)                  | HU-32        |    2,5 |
| 6    | e2e del API y Playwright (T18 a T20)                | Todas        |      3 |
| 7    | ADR y documentación (T21 y T22)                     | HU-03        |    1,5 |
| 8    | Definición de Terminado, informe y commit           | Todas        |    1,5 |
| —    | Holgura                                             | —            |    1,5 |
|      | **Total**                                           |              | **22** |

En el informe, las horas por historia siguen el backlog: HU-01 8 h, HU-02 3 h, HU-03 6 h, HU-06 3 h y
HU-32 2 h (D29). La capacidad del sprint es de 25 h; quedan 3 h de reserva.
